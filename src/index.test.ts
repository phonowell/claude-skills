import {
  lstat,
  mkdir,
  mkdtemp,
  readlink,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { echo } from 'fire-keeper'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ homeDir: '' }))

vi.mock('fire-keeper', async (importOriginal) => {
  const actual = await importOriginal()
  if (!actual || typeof actual !== 'object')
    throw new TypeError('invalid fire-keeper module')
  return {
    ...actual,
    echo: vi.fn(),
    home: vi.fn(() => state.homeDir),
  }
})

import { manageSkills } from './index.js'

const noopSyncExternal = () => Promise.resolve()

const createSkill = async (basePath: string, name: string, content: string) => {
  const skillPath = join(basePath, name)
  await mkdir(skillPath, { recursive: true })
  await writeFile(join(skillPath, 'SKILL.md'), content)
  return skillPath
}

const expectSymlinkTarget = async (targetPath: string, sourcePath: string) => {
  const stats = await lstat(targetPath)
  expect(stats.isSymbolicLink()).toBe(true)
  expect(await realpath(targetPath)).toBe(await realpath(sourcePath))
  expect(await realpath(await readlink(targetPath))).toBe(
    await realpath(sourcePath),
  )
}

describe('manageSkills', () => {
  let currentCwd = ''
  let repoDir = ''
  let homeDir = ''

  beforeEach(async () => {
    vi.clearAllMocks()
    currentCwd = process.cwd()
    repoDir = await mkdtemp(join(tmpdir(), 'skill-manager-repo-'))
    homeDir = await mkdtemp(join(tmpdir(), 'skill-manager-home-'))
    state.homeDir = homeDir
    await mkdir(join(repoDir, 'skills', 'local'), { recursive: true })
    await mkdir(join(repoDir, 'skills', 'external'), { recursive: true })
    process.chdir(repoDir)
  })

  afterEach(async () => {
    process.chdir(currentCwd)
    await rm(repoDir, { force: true, recursive: true })
    await rm(homeDir, { force: true, recursive: true })
  })

  it('imports a real global skill into external and relinks all standard roots', async () => {
    await createSkill(
      join(homeDir, '.claude', 'skills'),
      'custom-skill',
      'global',
    )

    const syncExternal = vi.fn(noopSyncExternal)

    await manageSkills(syncExternal)

    const externalSkill = join(repoDir, 'skills', 'external', 'custom-skill')
    await expectSymlinkTarget(
      join(homeDir, '.claude', 'skills', 'custom-skill'),
      externalSkill,
    )
    await expectSymlinkTarget(
      join(homeDir, '.codex', 'skills', 'custom-skill'),
      externalSkill,
    )
    await expectSymlinkTarget(
      join(homeDir, '.cursor', 'skills', 'custom-skill'),
      externalSkill,
    )
    await expectSymlinkTarget(
      join(homeDir, '.trae-cn', 'skills', 'custom-skill'),
      externalSkill,
    )
    expect(syncExternal).toHaveBeenCalledTimes(1)
  })

  it('keeps repo-created local skills in local when relinking', async () => {
    const localSkill = await createSkill(
      join(repoDir, 'skills', 'local'),
      'custom-local',
      'repo-local',
    )
    await createSkill(
      join(homeDir, '.claude', 'skills'),
      'custom-local',
      'repo-local',
    )

    await manageSkills(noopSyncExternal)

    await expectSymlinkTarget(
      join(homeDir, '.claude', 'skills', 'custom-local'),
      localSkill,
    )
  })

  it('replaces identical system directories with symlinks to project external skills', async () => {
    const externalSkill = await createSkill(
      join(repoDir, 'skills', 'external', 'anthropics'),
      'skill-creator',
      'same-content',
    )
    await createSkill(
      join(homeDir, '.codex', 'skills', '.system'),
      'skill-creator',
      'same-content',
    )

    await manageSkills(noopSyncExternal)

    await expectSymlinkTarget(
      join(homeDir, '.codex', 'skills', '.system', 'skill-creator'),
      externalSkill,
    )
    await expectSymlinkTarget(
      join(homeDir, '.claude', 'skills', 'skill-creator'),
      externalSkill,
    )
  })

  it('replaces conflicting system directories with project external skills', async () => {
    const externalSkill = await createSkill(
      join(repoDir, 'skills', 'external', 'openai'),
      'skill-installer',
      'repo-version',
    )
    await createSkill(
      join(homeDir, '.codex', 'skills', '.system'),
      'skill-installer',
      'system-version',
    )

    await manageSkills(noopSyncExternal)

    await expectSymlinkTarget(
      join(homeDir, '.codex', 'skills', '.system', 'skill-installer'),
      externalSkill,
    )
    expect(
      vi
        .mocked(echo)
        .mock.calls.some(([message]) =>
          String(message).includes('Replaced system skill'),
        ),
    ).toBe(true)
  })

  it('keeps existing external placement for system-only skills', async () => {
    const externalSkill = await createSkill(
      join(repoDir, 'skills', 'external', 'openai'),
      'openai-docs',
      'system-docs',
    )
    await createSkill(
      join(homeDir, '.codex', 'skills', '.system'),
      'openai-docs',
      'system-docs',
    )

    await manageSkills(noopSyncExternal)

    await expectSymlinkTarget(
      join(homeDir, '.codex', 'skills', '.system', 'openai-docs'),
      externalSkill,
    )
    await expect(
      lstat(join(repoDir, 'skills', 'local', 'openai-docs')),
    ).rejects.toThrow()
  })

  it('keeps conflicting real directories in place', async () => {
    const localSkill = await createSkill(
      join(repoDir, 'skills', 'local'),
      'custom-skill',
      'repo-version',
    )
    const globalSkill = await createSkill(
      join(homeDir, '.claude', 'skills'),
      'custom-skill',
      'global-version',
    )

    await manageSkills(noopSyncExternal)

    const stats = await lstat(globalSkill)
    expect(stats.isDirectory()).toBe(true)
    expect(stats.isSymbolicLink()).toBe(false)
    await expectSymlinkTarget(
      join(homeDir, '.codex', 'skills', 'custom-skill'),
      localSkill,
    )
  })

  it('relinks broken symlinks to the current flat project path', async () => {
    const externalSkill = await createSkill(
      join(repoDir, 'skills', 'external', 'vercel-labs'),
      'agent-browser',
      'external-version',
    )
    const brokenTarget = join(
      repoDir,
      'skills',
      'external',
      'shared',
      'agent-browser',
    )
    await mkdir(join(homeDir, '.claude', 'skills'), { recursive: true })
    await symlink(
      brokenTarget,
      join(homeDir, '.claude', 'skills', 'agent-browser'),
    )

    await manageSkills(noopSyncExternal)

    await expectSymlinkTarget(
      join(homeDir, '.claude', 'skills', 'agent-browser'),
      externalSkill,
    )
    expect(
      vi
        .mocked(echo)
        .mock.calls.some(([message]) =>
          String(message).includes('Removed broken link'),
        ),
    ).toBe(true)
  })
})
