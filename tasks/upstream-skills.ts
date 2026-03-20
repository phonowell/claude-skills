import { execFile } from 'node:child_process'
import { cp, lstat, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { Socket } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { promisify } from 'node:util'

import { echo, exec, glob } from 'fire-keeper'

type ExternalSkill = {
  name: string
  relativePath: string
  skillName: string
  skillsShUrl: string
}

type ResolvedSource = {
  repoUrl: string
  skillName: string
}

type SourceMode = {
  mode: 'dir' | 'root'
  path: string
}

type ProxyCandidate = {
  source: string
  url: string
}

const EXTERNAL_SKILL_GLOB = './skills/external/**/SKILL.md'
const EXTERNAL_SKILLS_PATH = join(process.cwd(), 'skills', 'external')
const CLONE_RETRY_COUNT = 2
const CLASH_CONFIG_PATHS = [
  join(
    process.env.HOME ?? '',
    'Library/Application Support/io.github.clash-verge-rev.clash-verge-rev/clash-verge.yaml',
  ),
  join(
    process.env.HOME ?? '',
    'Library/Application Support/io.github.clash-verge-rev.clash-verge-rev/clash-verge-check.yaml',
  ),
  join(process.env.HOME ?? '', '.config/mihomo/config.yaml'),
  join(process.env.HOME ?? '', '.config/clash/config.yaml'),
  join(process.env.HOME ?? '', '.config/clash.meta/config.yaml'),
]
const COMMON_PROXY_PORTS = [7897, 7890, 7891]
const execFileAsync = promisify(execFile)
const ROOT_SKILL_ENTRIES = [
  'SKILL.md',
  'agents',
  'assets',
  'LICENSE',
  'LICENSE.txt',
  'README.md',
  'references',
  'scripts',
  'templates',
]

const quote = (value: string) => JSON.stringify(value)
const normalizeRelativePath = (value: string) => value.replace(/\\/g, '/')
let cachedGitProxy: ProxyCandidate | null | undefined

const toSparsePattern = (value: string) => {
  const normalized = normalizeRelativePath(value).replace(/^\/+/, '')
  return `/${normalized}`
}
const getSkillsShCandidates = (relativePath: string) => {
  const parts = relativePath.split('/').filter(Boolean)
  if (parts.length === 2)
    return [relativePath, `${parts[0]}/skills/${parts[1]}`]
  if (parts.length === 3) return [relativePath]
  return []
}

const listExternalSkills = async (): Promise<ExternalSkill[]> => {
  const skillFiles = await glob(EXTERNAL_SKILL_GLOB, { onlyFiles: true })

  return skillFiles
    .map((skillFile) => {
      const skillDir = dirname(skillFile)
      const relativePath = normalizeRelativePath(
        relative(EXTERNAL_SKILLS_PATH, skillDir),
      )
      const parts = relativePath.split('/').filter(Boolean)

      if (parts.length < 2 || parts.length > 3) return undefined
      if (parts.some((part) => part.startsWith('.'))) return undefined

      const skillName = parts[parts.length - 1] ?? ''
      return {
        name: skillName,
        relativePath,
        skillName,
        skillsShUrl: `https://skills.sh/${getSkillsShCandidates(relativePath)[0]}`,
      }
    })
    .filter((skill): skill is ExternalSkill => Boolean(skill))
}

const parseSkillsShPage = (
  relativePath: string,
  html: string,
): ResolvedSource => {
  const commandMatch = html.match(/npx skills add ([^<]+)/)
  const command = commandMatch?.[1]?.trim() ?? ''
  const skillMatch = command.match(/--skill\s+([^\s<]+)/)
  const repoMatch = command.match(/(https:\/\/github\.com\/[^\s<]+)/)
  const githubLinkMatch = html.match(/href="(https:\/\/github\.com\/[^"]+)"/)
  const pathParts = relativePath.split('/').filter(Boolean)
  const repoUrl = repoMatch?.[1] ?? githubLinkMatch?.[1] ?? ''
  const skillName = (skillMatch?.[1] ?? pathParts[pathParts.length - 1]) || ''

  if (!repoUrl) {
    throw new Error(
      `Unable to resolve repo from skills.sh page: ${relativePath}`,
    )
  }
  if (!skillName) {
    throw new Error(
      `Unable to resolve skill name from skills.sh page: ${relativePath}`,
    )
  }

  return { repoUrl, skillName }
}

const resolveRemoteSource = async (
  relativePath: string,
  fetchImpl: typeof fetch = fetch,
) => {
  const candidates = getSkillsShCandidates(relativePath)
  let lastStatus = 0

  for (const candidate of candidates) {
    const response = await fetchImpl(`https://skills.sh/${candidate}`)
    if (!response.ok) {
      lastStatus = response.status
      if (response.status === 404) continue
      throw new Error(
        `Failed to fetch skills.sh page: ${candidate} (${response.status})`,
      )
    }

    const html = await response.text()
    return parseSkillsShPage(candidate, html)
  }

  throw new Error(
    `Failed to fetch skills.sh page: ${relativePath} (${lastStatus === 0 ? 'no-candidate' : String(lastStatus)})`,
  )
}

const buildSparsePaths = (skillName: string) =>
  Array.from(new Set([...ROOT_SKILL_ENTRIES, skillName, `skills/${skillName}`]))

const parsePort = (content: string, key: string) => {
  const match = content.match(new RegExp(`^${key}:\\s*(\\d+)\\s*$`, 'm'))
  const value = Number(match?.[1] ?? '')
  return Number.isInteger(value) && value > 0 ? value : 0
}

const parseProxyCandidatesFromConfig = (content: string): ProxyCandidate[] => {
  const candidates: ProxyCandidate[] = []
  const mixedPort = parsePort(content, 'mixed-port')
  const httpPort = parsePort(content, 'port')
  const socksPort = parsePort(content, 'socks-port')

  if (mixedPort) {
    candidates.push({
      source: `mixed-port:${mixedPort}`,
      url: `http://127.0.0.1:${mixedPort}`,
    })
  }

  if (httpPort) {
    candidates.push({
      source: `port:${httpPort}`,
      url: `http://127.0.0.1:${httpPort}`,
    })
  }

  if (socksPort) {
    candidates.push({
      source: `socks-port:${socksPort}`,
      url: `socks5://127.0.0.1:${socksPort}`,
    })
  }

  return candidates
}

const canConnectToProxy = (proxyUrl: string) => {
  const url = new URL(proxyUrl)
  const port = Number(url.port)

  if (!port) return false

  return new Promise<boolean>((resolve) => {
    const socket = new Socket()

    const finish = (result: boolean) => {
      socket.destroy()
      resolve(result)
    }

    socket.setTimeout(1000)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
    socket.connect(port, url.hostname)
  })
}

const detectGitProxy = async () => {
  if (cachedGitProxy !== undefined) return cachedGitProxy

  const envProxy =
    process.env.HTTPS_PROXY ??
    process.env.https_proxy ??
    process.env.HTTP_PROXY ??
    process.env.http_proxy ??
    process.env.ALL_PROXY ??
    process.env.all_proxy ??
    ''

  if (envProxy) {
    cachedGitProxy = { source: 'env', url: envProxy }
    return cachedGitProxy
  }

  for (const configPath of CLASH_CONFIG_PATHS) {
    if (!configPath) continue

    try {
      const content = await readFile(configPath, 'utf8')
      for (const candidate of parseProxyCandidatesFromConfig(content)) {
        if (!(await canConnectToProxy(candidate.url))) continue

        cachedGitProxy = {
          source: `${candidate.source}@${configPath}`,
          url: candidate.url,
        }
        return cachedGitProxy
      }
    } catch {}
  }

  for (const port of COMMON_PROXY_PORTS) {
    const candidate = `http://127.0.0.1:${port}`
    if (!(await canConnectToProxy(candidate))) continue

    cachedGitProxy = {
      source: `common-port:${port}`,
      url: candidate,
    }
    return cachedGitProxy
  }

  cachedGitProxy = null
  return cachedGitProxy
}

const buildCloneCommand = (repoUrl: string, target: string, proxyUrl = '') => {
  const proxyPrefix = proxyUrl
    ? `env HTTP_PROXY=${quote(proxyUrl)} HTTPS_PROXY=${quote(proxyUrl)} ALL_PROXY=${quote(proxyUrl)} http_proxy=${quote(proxyUrl)} https_proxy=${quote(proxyUrl)} all_proxy=${quote(proxyUrl)} `
    : ''

  return `${proxyPrefix}git clone --depth 1 --filter=blob:none --sparse --branch "main" ${quote(repoUrl)} ${quote(target)}`
}

const applySparseCheckout = async (
  repoDir: string,
  mode: 'set' | 'add',
  paths: string[],
) => {
  const patterns = Array.from(new Set(paths.map(toSparsePattern)))
  const noConeFlag = mode === 'set' ? ' --no-cone' : ''
  await exec(
    `git -C ${quote(repoDir)} sparse-checkout ${mode}${noConeFlag} ${patterns.map(quote).join(' ')}`,
  )
}

const cloneRepo = async (repoUrl: string, paths: string[], target: string) => {
  let proxyCandidate: ProxyCandidate | null = null

  for (let attempt = 1; attempt <= CLONE_RETRY_COUNT; attempt += 1) {
    await rm(target, { force: true, recursive: true })
    await exec(buildCloneCommand(repoUrl, target, proxyCandidate?.url ?? ''))

    try {
      await lstat(target)
      await applySparseCheckout(target, 'set', paths)
      return
    } catch (error) {
      if (!proxyCandidate) {
        proxyCandidate = await detectGitProxy()
        if (proxyCandidate) {
          echo(`use proxy ${proxyCandidate.url} (${proxyCandidate.source})`)
          continue
        }
      }

      if (attempt === CLONE_RETRY_COUNT) throw error
      echo(`retry clone ${repoUrl} (${attempt}/${CLONE_RETRY_COUNT})`)
    }
  }
}

const findSkillPathFromTree = (skillName: string, stdout: string) => {
  const candidates = stdout
    .split('\n')
    .map((line) => normalizeRelativePath(line.trim()))
    .filter(Boolean)
    .filter((line) => line.endsWith('/SKILL.md'))
    .map((line) => dirname(line))
    .filter((line) => line.split('/').at(-1) === skillName)
    .sort((left, right) => left.split('/').length - right.split('/').length)

  return candidates[0] ?? ''
}

const findSource = async (
  repoDir: string,
  skillName: string,
): Promise<SourceMode> => {
  const candidates = [
    join(repoDir, 'skills', skillName),
    join(repoDir, skillName),
  ]

  for (const candidate of candidates) {
    try {
      await lstat(join(candidate, 'SKILL.md'))
      return { mode: 'dir', path: candidate }
    } catch {}
  }

  const { stdout } = await execFileAsync('git', [
    '-C',
    repoDir,
    'ls-tree',
    '-r',
    '--name-only',
    'HEAD',
  ])
  const dynamicPath = findSkillPathFromTree(skillName, stdout)

  if (dynamicPath) {
    await applySparseCheckout(repoDir, 'add', [dynamicPath])
    const resolvedPath = join(repoDir, dynamicPath)
    await lstat(join(resolvedPath, 'SKILL.md'))
    return { mode: 'dir', path: resolvedPath }
  }

  await lstat(join(repoDir, 'SKILL.md'))
  return { mode: 'root', path: repoDir }
}

const syncRootSkill = async (repoDir: string, target: string) => {
  await rm(target, { force: true, recursive: true })
  await mkdir(target, { recursive: true })

  for (const entry of ROOT_SKILL_ENTRIES) {
    const source = join(repoDir, entry)
    try {
      await lstat(source)
    } catch {
      continue
    }

    await cp(source, join(target, entry), { force: true, recursive: true })
  }
}

const syncSkill = async (
  repoDir: string,
  skill: ExternalSkill,
  skillName: string,
) => {
  const source = await findSource(repoDir, skillName)
  const target = join(EXTERNAL_SKILLS_PATH, skill.relativePath)

  if (source.mode === 'dir') {
    await rm(target, { force: true, recursive: true })
    await mkdir(dirname(target), { recursive: true })
    await cp(source.path, target, { force: true, recursive: true })
  } else await syncRootSkill(source.path, target)

  echo(`synced ${skill.relativePath}`)
}

const syncUpstreamSkills = async (fetchImpl: typeof fetch = fetch) => {
  const externalSkills = await listExternalSkills()
  const resolvedSkills = await Promise.all(
    externalSkills.map(async (skill) => ({
      ...skill,
      source: await resolveRemoteSource(skill.relativePath, fetchImpl),
    })),
  )
  const tempBase = await mkdtemp(join(tmpdir(), 'skills-upstream-'))

  try {
    const groups = new Map<
      string,
      Array<ExternalSkill & { source: ResolvedSource }>
    >()

    for (const skill of resolvedSkills) {
      const list = groups.get(skill.source.repoUrl) ?? []
      list.push(skill)
      groups.set(skill.source.repoUrl, list)
    }

    let index = 0
    for (const [repoUrl, skills] of groups.entries()) {
      const repoDir = join(tempBase, `repo-${index}`)
      const sparsePaths = Array.from(
        new Set(
          skills.flatMap((skill) => buildSparsePaths(skill.source.skillName)),
        ),
      )

      await cloneRepo(repoUrl, sparsePaths, repoDir)

      for (const skill of skills)
        await syncSkill(repoDir, skill, skill.source.skillName)
      index += 1
    }
  } finally {
    await rm(tempBase, { force: true, recursive: true })
  }
}

export {
  buildCloneCommand,
  canConnectToProxy,
  findSkillPathFromTree,
  detectGitProxy,
  getSkillsShCandidates,
  listExternalSkills,
  parseProxyCandidatesFromConfig,
  parseSkillsShPage,
  resolveRemoteSource,
  syncUpstreamSkills,
}
export default syncUpstreamSkills
