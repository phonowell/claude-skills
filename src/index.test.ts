import { lstat, readlink, stat, symlink } from 'node:fs/promises'
import { posix } from 'node:path'

import { glob, home, mkdir, remove } from 'fire-keeper'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { linkSkills } from './index.js'

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

const setupMockGlob = (
  localPaths: string[],
  targetEntriesByRoot: Record<string, string[]> = {},
) => {
  vi.mocked(glob).mockImplementation((input) => {
    const pattern = typeof input === 'string' ? input : input[0]
    if (pattern.startsWith('./skills/'))
      return Promise.resolve(localPaths as unknown as ListSource)

    if (pattern.endsWith('/*')) {
      const root = pattern.slice(0, -2)
      const targetEntries = targetEntriesByRoot[root] ?? []
      return Promise.resolve(targetEntries as unknown as ListSource)
    }

    return Promise.resolve([] as unknown as ListSource)
  })
}

const createEnoent = (): NodeJS.ErrnoException => {
  const err = new Error('ENOENT') as NodeJS.ErrnoException
  err.code = 'ENOENT'
  return err
}

vi.mock('fire-keeper', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('fire-keeper')>()
  return {
    ...actual,
    echo: vi.fn(),
    glob: vi.fn() as typeof glob,
    home: vi.fn(),
    mkdir: vi.fn(),
    remove: vi.fn(),
  }
})

vi.mock('node:fs/promises', () => ({
  lstat: vi.fn(),
  readlink: vi.fn(),
  stat: vi.fn(),
  symlink: vi.fn(),
}))

describe('linkSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(home).mockReturnValue('/Users/test')
  })

  it('recreates symlinked roots and links non-hidden folders', async () => {
    const localAlpha = posix.join('/repo', 'skills', 'alpha')
    const localHidden = posix.join('/repo', 'skills', '.hidden')

    setupMockGlob([localAlpha, localHidden])

    vi.mocked(lstat).mockImplementation((path) => {
      if (path === '/Users/test/.claude/skills') {
        return Promise.resolve(
          createMockStats({ isFile: false, isSymbolicLink: true }),
        )
      }

      return Promise.reject(createEnoent())
    })

    await linkSkills()

    const removeCalls = vi
      .mocked(remove)
      .mock.calls.map(([value]) => String(value))
    expect(removeCalls).toContain('/Users/test/.claude/skills')

    const mkdirCalls = vi
      .mocked(mkdir)
      .mock.calls.map(([value]) => String(value))
    expect(mkdirCalls).toContain('/Users/test/.claude/skills')

    const symlinkCalls = vi.mocked(symlink).mock.calls.map(([src, dest]) => ({
      src: src.toString(),
      dest: dest.toString(),
    }))
    expect(symlinkCalls.length).toBe(4)
    expect(symlinkCalls.every((call) => call.src === localAlpha)).toBe(true)
    expect(symlinkCalls.some((call) => call.dest.endsWith('/.hidden'))).toBe(
      false,
    )
  })

  it('replaces existing copied folders with symlinks', async () => {
    const localAlpha = posix.join('/repo', 'skills', 'alpha')

    setupMockGlob([localAlpha])

    vi.mocked(lstat).mockImplementation((path) => {
      const value = path.toString()
      if (value.endsWith('/skills')) {
        return Promise.resolve(
          createMockStats({ isFile: false, isDirectory: true }),
        )
      }

      if (value.endsWith('/skills/alpha')) {
        return Promise.resolve(
          createMockStats({ isFile: false, isDirectory: true }),
        )
      }

      return Promise.reject(createEnoent())
    })

    await linkSkills()

    const removeCalls = vi
      .mocked(remove)
      .mock.calls.map(([value]) => String(value))
    expect(removeCalls.some((value) => value.endsWith('/skills/alpha'))).toBe(
      true,
    )
    expect(vi.mocked(symlink).mock.calls.length).toBe(4)
  })

  it('skips relinking when already linked', async () => {
    const localAlpha = posix.join('/repo', 'skills', 'alpha')

    setupMockGlob([localAlpha])
    vi.mocked(readlink).mockResolvedValue(localAlpha)

    vi.mocked(lstat).mockImplementation((path) => {
      const value = path.toString()
      if (value.endsWith('/skills')) {
        return Promise.resolve(
          createMockStats({ isFile: false, isDirectory: true }),
        )
      }

      if (value.endsWith('/skills/alpha')) {
        return Promise.resolve(
          createMockStats({ isFile: false, isSymbolicLink: true }),
        )
      }

      return Promise.reject(createEnoent())
    })

    await linkSkills()

    expect(vi.mocked(symlink).mock.calls.length).toBe(0)
    expect(vi.mocked(remove).mock.calls.length).toBe(0)
  })

  it('removes broken symlinks in target roots', async () => {
    const localAlpha = posix.join('/repo', 'skills', 'alpha')
    const orphan = '/Users/test/.claude/skills/orphan'

    setupMockGlob([localAlpha], {
      '/Users/test/.claude/skills': [orphan],
    })

    vi.mocked(lstat).mockImplementation((path) => {
      const value = path.toString()
      if (value === '/Users/test/.claude/skills') {
        return Promise.resolve(
          createMockStats({ isFile: false, isDirectory: true }),
        )
      }

      if (value === orphan) {
        return Promise.resolve(
          createMockStats({ isFile: false, isSymbolicLink: true }),
        )
      }

      return Promise.reject(createEnoent())
    })

    vi.mocked(stat).mockImplementation((path) => {
      if (path.toString() === orphan) return Promise.reject(createEnoent())
      return Promise.resolve(
        createMockStats({ isFile: false, isDirectory: true }),
      )
    })

    await linkSkills()

    const removeCalls = vi
      .mocked(remove)
      .mock.calls.map(([value]) => String(value))
    expect(removeCalls).toContain(orphan)
  })
})
