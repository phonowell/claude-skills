#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
const LOGIN_PATTERN = /(登录|扫码|sign[\s-]?in|sso|tapd平台登录)/i;
const FORBIDDEN_PATTERN = /(\b403\b|forbidden|access denied|无权限|没有权限)/i;
const REDIRECT_PATTERN = /(重定向|redirect|302 found|moved temporarily)/i;
const NOT_FOUND_PATTERN = /(页面不存在|page not found|出错了)/i;
const fail = (message, code = 1) => {
  console.error(message);
  process.exit(code);
};
const parseArgs = (argv) => {
  const options = {
    repoPath: "",
    storyId: "",
    storyUrl: "",
    cdpPort: "9334",
    overwrite: false,
    outDir: "docs/requirements",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: node skills/tapd-fetch-and-archive/scripts/fetch-and-archive.js --repo-path <path> (--story-id <id> | --story-url <url>) [--cdp-port 9334] [--overwrite] [--out-dir docs/requirements]");
      process.exit(0);
    }
    if (arg === "--overwrite") { options.overwrite = true; continue; }
    const value = argv[i + 1];
    if (!value) fail(`missing value for ${arg}`);
    if (arg === "--repo-path") options.repoPath = value;
    else if (arg === "--story-id") options.storyId = value;
    else if (arg === "--story-url") options.storyUrl = value;
    else if (arg === "--cdp-port") options.cdpPort = value;
    else if (arg === "--out-dir") options.outDir = value;
    else fail(`unknown arg: ${arg}`);
    i += 1;
  }
  if (!options.repoPath) fail("missing required arg: --repo-path");
  if (!options.storyId && !options.storyUrl) fail("missing required arg: --story-id or --story-url");
  return options;
};
const firstNonEmptyLine = (text) => text.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "";
const compactText = (text) => text.replace(/\r/g, "").replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
const decodeHtml = (html) => html.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");
const htmlToText = (html) => {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, "\n");
  return compactText(decodeHtml(stripped));
};
const extractStoryId = (storyId, storyUrl) => {
  if (storyId) return storyId.replace(/[^\d]/g, "");
  const url = new URL(storyUrl);
  const pathMatch = url.pathname.match(/\/stories\/view\/(\d{8,})/);
  if (pathMatch?.[1]) return pathMatch[1];
  const dialogId = url.searchParams.get("dialog_preview_id");
  const dialogMatch = dialogId?.match(/story_(\d{8,})/);
  if (dialogMatch?.[1]) return dialogMatch[1];
  const queryId = url.searchParams.get("story_id");
  if (queryId) return queryId.replace(/[^\d]/g, "");
  const allMatches = url.href.match(/\d{8,}/g) ?? [];
  if (allMatches.length === 0) return "";
  return allMatches.sort((a, b) => b.length - a.length)[0];
};
const resolveStoryUrl = (storyId, storyUrl) => {
  if (storyUrl) return storyUrl;
  const template = process.env.TAPD_STORY_URL_TEMPLATE;
  if (template?.includes("{id}")) return template.replace("{id}", storyId);
  return `https://www.tapd.cn/my_worktable/show?story_id=${storyId}`;
};
const run = (cmd, args, env = process.env) => {
  const result = spawnSync(cmd, args, { encoding: "utf8", env });
  return { code: result.status ?? 1, stdout: (result.stdout ?? "").trim(), stderr: (result.stderr ?? "").trim() };
};
const fetchViaCdp = ({ storyUrl, cdpPort, session }) => {
  const baseArgs = ["--session", session, "--cdp", cdpPort];
  const openRes = run("agent-browser", [...baseArgs, "open", storyUrl]);
  if (openRes.code !== 0) throw new Error(openRes.stderr || openRes.stdout || "agent-browser open failed");
  const waitRes = run("agent-browser", [...baseArgs, "wait", "--load", "networkidle"]);
  if (waitRes.code !== 0) throw new Error(waitRes.stderr || waitRes.stdout || "agent-browser wait failed");
  const evalExpr = "(function(){const a=['main article','.story-detail','.story-content','.wiki-content','.editor-content','.detail-content','article','main'];const n=[];for(const s of a){for(const e of document.querySelectorAll(s)){const t=(e.innerText||'').trim();if(t.length>0)n.push(t);}}const b=(document.body&&document.body.innerText?document.body.innerText:'').trim();const t=n.sort((x,y)=>y.length-x.length)[0]||b;return {url:location.href,title:document.title||'',text:t};})()";
  const evalRes = run("agent-browser", [...baseArgs, "--json", "eval", evalExpr]);
  run("agent-browser", [...baseArgs, "close"]);
  if (evalRes.code !== 0) throw new Error(evalRes.stderr || evalRes.stdout || "agent-browser eval failed");
  const payload = JSON.parse(evalRes.stdout);
  const result = payload?.data?.result;
  if (!result || typeof result.text !== "string") throw new Error("cdp returned empty payload");
  return { text: compactText(result.text), finalUrl: result.url || storyUrl, title: result.title || "" };
};
const fetchViaCurl = ({ storyUrl }) => {
  const args = ["-sS", "-L", "--max-time", "40", "--connect-timeout", "8", "-A", process.env.TAPD_USER_AGENT || "Mozilla/5.0", storyUrl];
  if (process.env.TAPD_COOKIE) args.unshift("-H", `Cookie: ${process.env.TAPD_COOKIE}`);
  if (process.env.TAPD_HEADERS_JSON) {
    const headers = JSON.parse(process.env.TAPD_HEADERS_JSON);
    for (const [key, value] of Object.entries(headers)) args.unshift("-H", `${key}: ${String(value)}`);
  }
  const curlRes = run("curl", args);
  if (curlRes.code !== 0) throw new Error(curlRes.stderr || "curl failed");
  const titleMatch = curlRes.stdout.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return {
    text: htmlToText(curlRes.stdout),
    finalUrl: storyUrl,
    title: compactText(decodeHtml(titleMatch?.[1] ?? "")),
  };
};
const validateOriginal = (content) => {
  const issues = [];
  if (!content.trim()) issues.push("EMPTY_CONTENT");
  if (/<html[\s>]/i.test(content)) issues.push("HTML_NOT_PARSED");
  const line1 = firstNonEmptyLine(content);
  if (!line1) issues.push("NO_FIRST_LINE");
  if (/^(来源|source|抓取时间|summary|摘要)/i.test(line1)) issues.push("FIRST_LINE_NOT_BODY");
  const probe = content.slice(0, 6000);
  if (LOGIN_PATTERN.test(probe)) issues.push("LOGIN_PAGE");
  if (FORBIDDEN_PATTERN.test(probe)) issues.push("FORBIDDEN_PAGE");
  if (REDIRECT_PATTERN.test(probe)) issues.push("REDIRECT_PAGE");
  if (NOT_FOUND_PATTERN.test(probe)) issues.push("NOT_FOUND_PAGE");
  return { ok: issues.length === 0, line1, issues };
};
const buildFixSteps = () => [
  "打开已登录 TAPD 的 Edge/Chrome，并确认以 --remote-debugging-port=<port> 启动。",
  "执行 curl http://127.0.0.1:<port>/json/version 验证 CDP 端口可访问。",
  "若需 curl 回退，设置 TAPD_COOKIE（可选 TAPD_HEADERS_JSON/TAPD_USER_AGENT）后重试。",
  "必要时直接传入 --story-url 完整链接，避免仅 story-id 解析到错误页面。",
];
const writeMeta = (metaPath, content) => writeFileSync(metaPath, `${content.trim()}\n`, "utf8");
const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const storyId = extractStoryId(options.storyId, options.storyUrl);
  if (!storyId) fail("unable to resolve story id; provide --story-id or a URL containing story_id");
  const storyUrl = resolveStoryUrl(storyId, options.storyUrl);
  const repoPath = resolve(options.repoPath);
  const outDir = isAbsolute(options.outDir) ? options.outDir : resolve(join(repoPath, options.outDir));
  const originalPath = join(outDir, `tapd-${storyId}-original.md`);
  const metaPath = join(outDir, `tapd-${storyId}-original.meta.md`);
  mkdirSync(dirname(originalPath), { recursive: true });
  const attempts = [];
  let fetchMethod = "existing-file";
  let sourceText = existsSync(originalPath) ? readFileSync(originalPath, "utf8") : "";
  let finalUrl = storyUrl;
  let title = "";
  if (!existsSync(originalPath) || options.overwrite) {
    const session = `tapd-archive-${Date.now()}`;
    try { const cdp = fetchViaCdp({ storyUrl, cdpPort: options.cdpPort, session }); sourceText = cdp.text; finalUrl = cdp.finalUrl; title = cdp.title; fetchMethod = "cdp"; attempts.push("cdp:ok"); }
    catch (error) { attempts.push(`cdp:fail:${error instanceof Error ? error.message : String(error)}`); }
    if (fetchMethod !== "cdp") {
      try { const curl = fetchViaCurl({ storyUrl }); sourceText = curl.text; finalUrl = curl.finalUrl; title = curl.title; fetchMethod = "curl"; attempts.push("curl:ok"); }
      catch (error) { attempts.push(`curl:fail:${error instanceof Error ? error.message : String(error)}`); }
    }
    if (fetchMethod === "cdp" || fetchMethod === "curl") writeFileSync(originalPath, `${sourceText.trim()}\n`, "utf8");
  } else {
    attempts.push("fetch:skipped:original-exists");
  }
  const validation = validateOriginal(sourceText);
  const archivedAt = new Date().toISOString();
  const fixes = buildFixSteps();
  const meta = [
    "# TAPD Archive Meta",
    "",
    `- story_id: ${storyId}`,
    `- story_url: ${storyUrl}`,
    `- final_url: ${finalUrl}`,
    `- archived_at: ${archivedAt}`,
    `- fetch_method: ${fetchMethod}`,
    `- cdp_port: ${options.cdpPort}`,
    `- overwrite: ${options.overwrite}`,
    `- original_file: ${originalPath}`,
    `- meta_file: ${metaPath}`,
    `- validation: ${validation.ok ? "PASS" : "FAIL"}`,
    `- first_non_empty_line: ${validation.line1 || "(empty)"}`,
    `- title: ${title || "(none)"}`,
    `- attempts: ${attempts.join(" | ")}`,
    `- node: ${process.version}`,
    `- platform: ${process.platform}`,
    "",
    "## Validation Issues",
    ...(validation.issues.length ? validation.issues.map((item) => `- ${item}`) : ["- NONE"]),
    "",
    "## Repair Steps",
    ...fixes.map((step) => `- ${step}`),
  ].join("\n");
  writeMeta(metaPath, meta);
  if (!validation.ok) {
    console.error(`validation failed: ${validation.issues.join(", ")}`);
    for (const step of fixes) console.error(`- ${step}`);
    process.exit(2);
  }
  console.log(`ok: ${originalPath}`);
  console.log(`meta: ${metaPath}`);
};
main();
