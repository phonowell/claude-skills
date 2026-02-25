#!/usr/bin/env node
import {
  chmodSync,
  existsSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const INSTALLABLE_FILES = [
  "git-utils.js",
  "rebase-worktree.js",
  "land-worktree.js",
];

const exitWith = (message) => {
  console.error(message);
  process.exit(1);
};

const parseArgs = (argv) => {
  const options = {
    repoRoot: "",
    targetDir: "",
    base: "main",
    plansDir: "plans",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: node skills/init-worktree/scripts/install-worktree.js --repo-root <path> [--target-dir scripts|tasks] [--base <branch>] [--plans-dir <dir>]",
      );
      process.exit(0);
    }
    if (arg === "--repo-root") {
      const value = argv[i + 1];
      if (!value) exitWith("missing value for --repo-root");
      options.repoRoot = value;
      i += 1;
      continue;
    }
    if (arg === "--target-dir") {
      const value = argv[i + 1];
      if (!value) exitWith("missing value for --target-dir");
      if (value !== "scripts" && value !== "tasks") {
        exitWith("target dir must be scripts or tasks");
      }
      options.targetDir = value;
      i += 1;
      continue;
    }
    if (arg === "--base") {
      const value = argv[i + 1];
      if (!value) exitWith("missing value for --base");
      options.base = value;
      i += 1;
      continue;
    }
    if (arg === "--plans-dir") {
      const value = argv[i + 1];
      if (!value) exitWith("missing value for --plans-dir");
      options.plansDir = value;
      i += 1;
      continue;
    }
    exitWith(`unknown arg: ${arg}`);
  }
  if (!options.repoRoot) exitWith("missing required arg: --repo-root");
  return options;
};

const pickTargetDir = (repoRoot, preferred) => {
  if (preferred) return preferred;
  if (existsSync(join(repoRoot, "scripts"))) return "scripts";
  if (existsSync(join(repoRoot, "tasks"))) return "tasks";
  return "scripts";
};

const readPackageJson = (repoRoot) => {
  const packageJsonPath = join(repoRoot, "package.json");
  if (!existsSync(packageJsonPath)) exitWith(`package.json not found: ${repoRoot}`);
  try {
    return {
      path: packageJsonPath,
      data: JSON.parse(readFileSync(packageJsonPath, "utf8")),
    };
  } catch {
    exitWith(`invalid package.json: ${packageJsonPath}`);
  }
};

const buildInstalledScript = (source, targetExt) => {
  if (targetExt === "js") return source;
  return source.replace(/\.\/git-utils\.js/g, "./git-utils.mjs");
};

const ensureExecutable = (filePath) => {
  try {
    chmodSync(filePath, 0o755);
  } catch {
    process.stderr.write("");
  }
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = resolve(options.repoRoot);
  const targetDir = pickTargetDir(repoRoot, options.targetDir);
  const targetWorktreeDir = join(repoRoot, targetDir, "worktree");
  const skillScriptDir = dirname(fileURLToPath(import.meta.url));
  const pkg = readPackageJson(repoRoot);
  const targetExt = pkg.data.type === "module" ? "js" : "mjs";
  const staleExt = targetExt === "js" ? "mjs" : "js";

  mkdirSync(targetWorktreeDir, { recursive: true });
  for (const fileName of INSTALLABLE_FILES) {
    const src = join(skillScriptDir, fileName);
    const stem = fileName.replace(/\.js$/, "");
    const dest = join(targetWorktreeDir, `${stem}.${targetExt}`);
    const stale = join(targetWorktreeDir, `${stem}.${staleExt}`);
    if (!existsSync(src)) exitWith(`missing skill file: ${src}`);
    const source = readFileSync(src, "utf8");
    const installed = buildInstalledScript(source, targetExt);
    writeFileSync(dest, installed, "utf8");
    rmSync(stale, { force: true });
    ensureExecutable(dest);
  }

  if (!pkg.data.scripts || typeof pkg.data.scripts !== "object") {
    pkg.data.scripts = {};
  }

  const scriptPrefix = `${targetDir}/worktree`;
  const rebaseCommand = `node ${scriptPrefix}/rebase-worktree.${targetExt} --base ${options.base}`;
  const landCommand = `node ${scriptPrefix}/land-worktree.${targetExt} --base ${options.base} --plans-dir ${options.plansDir}`;
  pkg.data.scripts["wt-rebase"] = rebaseCommand;
  pkg.data.scripts["wt-land"] = landCommand;
  if (
    typeof pkg.data.scripts.rebase === "string" &&
    pkg.data.scripts.rebase.includes(`${scriptPrefix}/rebase-worktree.`)
  ) {
    delete pkg.data.scripts.rebase;
  }
  if (
    typeof pkg.data.scripts.land === "string" &&
    pkg.data.scripts.land.includes(`${scriptPrefix}/land-worktree.`)
  ) {
    delete pkg.data.scripts.land;
  }

  writeFileSync(pkg.path, `${JSON.stringify(pkg.data, null, 2)}\n`, "utf8");

  console.log(`installed: ${targetWorktreeDir}`);
  console.log(`runtime: .${targetExt}`);
  console.log(`package scripts: wt-rebase, wt-land`);
  if (targetExt === "mjs") {
    console.log(`info: package.json type is not module; installed .mjs scripts`);
  }
};

main();
