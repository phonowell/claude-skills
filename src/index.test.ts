import { lstat, readlink, rename, symlink, unlink } from 'node:fs/promises'
import { posix } from 'node:path'

import { glob, home, stat } from 'fire-keeper'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { overwriteFile, promptAction } from '../tasks/mimiko/operations.js'

import main, { linkSkills } from './index.js'

import type { Stats } from 'node:fs'

type MockStatOptions = {
  isFile?: boolean
  isDirectory?: boolean
  isSymbolicLink?: boolean
}

type ListSource = string[] & {
  __IS_LISTED_AS_SOURCE__: true
}

const createMockStats = (options: MockStatOptions = {}): Stats => {
  const { isFile = true, isDirectory = false, isSymbolicLink = false } = options
  return {
    isFile: () => isFile,
    isDirectory: () => isDirectory,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => isSymbolicLink,
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
  }
}

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
    home: vi.fn(),
    isSame: vi.fn(() => Promise.resolve(false)),
    stat: vi.fn() as typeof stat,
  }
})

vi.mock('node:fs/promises', () => ({
  lstat: vi.fn(),
  readlink: vi.fn(),
  rename: vi.fn(),
  symlink: vi.fn(),
  unlink: vi.fn(),
}))

vi.mock('../tasks/mimiko/operations.js', () => ({
  overwriteFile: vi.fn(),
  promptAction: vi.fn(() => Promise.resolve('skip')),
}))

describe('sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call promptAction with (local, remote) when files differ', async () => {
    const { homedir } = await import('node:os')
    const cwd = process.cwd()
    const localPath = posix.join(cwd, 'skills', 'test.md')
    const remotePath = posix.join(homedir(), '.claude', 'skills', 'test.md')

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
    const { homedir } = await import('node:os')
    const cwd = process.cwd()
    const localPath = posix.join(cwd, 'skills', 'test.md')
    const remotePath = posix.join(homedir(), '.claude', 'skills', 'test.md')

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
    const { homedir } = await import('node:os')
    const remotePath = posix.join(homedir(), '.claude', 'skills', 'test.md')

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
    const cwd = process.cwd()
    const localPath = posix.join(cwd, 'skills', 'test.md')

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

const describeLinkSkills =
  process.platform === 'win32' ? describe : describe.skip

describeLinkSkills('linkSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('treats win32 readlink output as already linked', async () => {
    vi.mocked(home).mockReturnValue('C:/Users/test')
    vi.mocked(stat).mockResolvedValue(
      createMockStats({ isFile: false, isDirectory: true }),
    )
    vi.mocked(lstat).mockResolvedValue(
      createMockStats({ isFile: false, isSymbolicLink: true }),
    )
    vi.mocked(readlink).mockResolvedValue(
      '\\\\?\\C:\\Users\\test\\.claude\\skills',
    )

    await linkSkills()

    expect(vi.mocked(unlink).mock.calls.length).toBe(0)
    expect(vi.mocked(rename).mock.calls.length).toBe(0)
    expect(vi.mocked(symlink).mock.calls.length).toBe(0)
  })

  it('treats win32 UNC readlink output as already linked', async () => {
    vi.mocked(home).mockReturnValue('\\\\server\\share\\user')
    vi.mocked(stat).mockResolvedValue(
      createMockStats({ isFile: false, isDirectory: true }),
    )
    vi.mocked(lstat).mockResolvedValue(
      createMockStats({ isFile: false, isSymbolicLink: true }),
    )
    vi.mocked(readlink).mockResolvedValue(
      '\\\\?\\UNC\\server\\share\\user\\.claude\\skills',
    )

    await linkSkills()

    expect(vi.mocked(unlink).mock.calls.length).toBe(0)
    expect(vi.mocked(rename).mock.calls.length).toBe(0)
    expect(vi.mocked(symlink).mock.calls.length).toBe(0)
  })
})
