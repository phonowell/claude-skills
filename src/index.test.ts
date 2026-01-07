import { glob, stat } from 'fire-keeper'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { overwriteFile, promptAction } from '../tasks/mimiko/operations.js'

import main from './index.js'

import type { Stats } from 'node:fs'

type ListSource = string[] & {
  __IS_LISTED_AS_SOURCE__: true
}

const createMockStats = (): Stats => ({
  isFile: () => true,
  isDirectory: () => false,
  isBlockDevice: () => false,
  isCharacterDevice: () => false,
  isSymbolicLink: () => false,
  isFIFO: () => false,
  isSocket: () => false,
  dev: 0,
  ino: 0,
  mode: 0,
  nlink: 0,
  uid: 0,
  gid: 0,
  rdev: 0,
  size: 0,
  blksize: 0,
  blocks: 0,
  atimeMs: 0,
  mtimeMs: 0,
  ctimeMs: 0,
  birthtimeMs: 0,
  atime: new Date(),
  mtime: new Date(),
  ctime: new Date(),
  birthtime: new Date(),
})

const setupMockGlob = (localPaths: string[], remotePaths: string[]) => {
  vi.mocked(glob).mockImplementation((input) => {
    const pattern = typeof input === 'string' ? input : input[0]
    if (pattern.includes('skills/**/*') && !pattern.includes('.claude'))
      return Promise.resolve(localPaths as unknown as ListSource)
    if (pattern.includes('.claude'))
      return Promise.resolve(remotePaths as unknown as ListSource)
    return Promise.resolve([] as unknown as ListSource)
  })
}

const setupMockStat = () => {
  vi.mocked(stat).mockImplementation((path) => {
    if (path.includes('skills') || path.includes('.claude'))
      return Promise.resolve(createMockStats())

    return Promise.resolve(null)
  })
}

vi.mock('fire-keeper', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('fire-keeper')>()
  return {
    ...actual,
    copy: vi.fn(),
    echo: vi.fn(),
    glob: vi.fn() as typeof glob,
    isSame: vi.fn(() => Promise.resolve(false)),
    stat: vi.fn() as typeof stat,
  }
})

vi.mock('../tasks/mimiko/operations.js', () => ({
  overwriteFile: vi.fn(),
  promptAction: vi.fn(() => Promise.resolve('skip')),
}))

describe('sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call promptAction with (local, remote) when files differ', async () => {
    const { join } = await import('node:path')
    const { homedir } = await import('node:os')
    const cwd = process.cwd()
    const localPath = join(cwd, 'skills', 'test.md')
    const remotePath = join(homedir(), '.claude', 'skills', 'test.md')

    setupMockGlob([localPath], [remotePath])
    setupMockStat()
    vi.mocked(promptAction).mockResolvedValueOnce('local <- remote')

    await main()

    const { calls } = vi.mocked(promptAction).mock
    expect(calls.length).toBeGreaterThan(0)
    const call = calls[0]
    expect(call[0]).toContain('skills')
    expect(call[1]).toContain('.claude')
  })

  it('should call overwriteFile with correct action', async () => {
    const { join } = await import('node:path')
    const { homedir } = await import('node:os')
    const cwd = process.cwd()
    const localPath = join(cwd, 'skills', 'test.md')
    const remotePath = join(homedir(), '.claude', 'skills', 'test.md')

    setupMockGlob([localPath], [remotePath])
    setupMockStat()
    vi.mocked(promptAction).mockResolvedValueOnce('local -> remote')

    await main()

    const { calls } = vi.mocked(overwriteFile).mock
    expect(calls.length).toBeGreaterThan(0)
    const call = calls[0]
    expect(call[0]).toBe('local -> remote')
    expect(call[1]).toContain('skills')
    expect(call[2]).toContain('.claude')
  })

  it('should call promptAction with ("", remote) when only remote exists', async () => {
    const { join } = await import('node:path')
    const { homedir } = await import('node:os')
    const remotePath = join(homedir(), '.claude', 'skills', 'test.md')

    setupMockGlob([], [remotePath])
    setupMockStat()
    vi.mocked(promptAction).mockResolvedValueOnce('local <- remote')

    await main()

    const { calls } = vi.mocked(promptAction).mock
    expect(calls.length).toBeGreaterThan(0)
    const call = calls[0]
    expect(call[0]).toBe('')
    expect(call[1]).toContain('.claude')
  })

  it('should call promptAction with (local, "") when only local exists', async () => {
    const { join } = await import('node:path')
    const cwd = process.cwd()
    const localPath = join(cwd, 'skills', 'test.md')

    setupMockGlob([localPath], [])
    setupMockStat()
    vi.mocked(promptAction).mockResolvedValueOnce('local -> remote')

    await main()

    const { calls } = vi.mocked(promptAction).mock
    expect(calls.length).toBeGreaterThan(0)
    const call = calls[0]
    expect(call[0]).toContain('skills')
    expect(call[1]).toBe('')
  })
})
