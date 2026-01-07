import { homedir } from 'node:os'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import main from './sync.js'

const { glob, stat } = await import('fire-keeper')
const { overwriteFile, promptAction } = await import('./mimiko/operations.js')

vi.mock('fire-keeper', () => ({
  copy: vi.fn(),
  echo: vi.fn(),
  getName: vi.fn((path: string) => {
    const parts = path.split('/')
    const dirname = parts.slice(0, -1).join('/')
    return {
      dirname: dirname || '.',
      filename: parts[parts.length - 1],
    }
  }),
  glob: vi.fn(),
  isSame: vi.fn(() => Promise.resolve(false)),
  stat: vi.fn(),
}))

vi.mock('./mimiko/operations.js', () => ({
  overwriteFile: vi.fn(),
  promptAction: vi.fn(() => Promise.resolve('skip')),
}))

describe('sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call promptAction with (local, remote) when files differ', async () => {
    const { join } = await import('node:path')
    const cwd = process.cwd()
    const localPath = join(cwd, 'skills', 'test.md')
    const remotePath = join(homedir(), '.claude', 'skills', 'test.md')

    vi.mocked(glob).mockImplementation((pattern: string) => {
      if (pattern === 'skills/**/*') return Promise.resolve([localPath])
      if (pattern.includes('.claude')) return Promise.resolve([remotePath])
      return Promise.resolve([])
    })

    vi.mocked(stat).mockImplementation((path: string) => {
      if (path.includes('skills'))
        return Promise.resolve({ isFile: () => true, mtimeMs: 50 })
      if (path.includes('.claude'))
        return Promise.resolve({ isFile: () => true, mtimeMs: 100 })
      return Promise.resolve({ isFile: () => false })
    })

    vi.mocked(promptAction).mockResolvedValueOnce('local <- remote')

    await main()

    const { calls } = vi.mocked(promptAction).mock
    expect(calls.length).toBeGreaterThan(0)
    const call = calls[0]
    expect(call[0]).toContain('skills')
    expect(call[1]).toContain('.claude')
  })

  it('should call overwriteFile with correct action', async () => {
    const cwd = process.cwd()
    const localPath = `${cwd}/skills/test.md`
    const remotePath = `${homedir()}/.claude/skills/test.md`

    vi.mocked(glob).mockImplementation((pattern: string) => {
      if (pattern.startsWith('skills/')) return Promise.resolve([localPath])
      if (pattern.includes('.claude')) return Promise.resolve([remotePath])
      return Promise.resolve([])
    })

    vi.mocked(stat).mockImplementation((path: string) => {
      if (path.includes('skills'))
        return Promise.resolve({ isFile: () => true, mtimeMs: 100 })
      if (path.includes('.claude'))
        return Promise.resolve({ isFile: () => true, mtimeMs: 50 })
      return Promise.resolve({ isFile: () => false })
    })

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
    const remotePath = `${homedir()}/.claude/skills/test.md`

    vi.mocked(glob).mockImplementation((pattern: string) => {
      if (pattern.includes('.claude')) return Promise.resolve([remotePath])
      return Promise.resolve([])
    })

    vi.mocked(stat).mockImplementation((path: string) => {
      if (path.includes('.claude'))
        return Promise.resolve({ isFile: () => true, mtimeMs: 100 })
      return Promise.resolve({ isFile: () => false })
    })

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
    const localPath = `${cwd}/skills/test.md`

    vi.mocked(glob).mockImplementation((pattern: string) => {
      if (pattern.startsWith('skills/')) return Promise.resolve([localPath])
      return Promise.resolve([])
    })

    vi.mocked(stat).mockImplementation((path: string) => {
      if (path.includes('skills'))
        return Promise.resolve({ isFile: () => true, mtimeMs: 100 })
      return Promise.resolve({ isFile: () => false })
    })

    vi.mocked(promptAction).mockResolvedValueOnce('local -> remote')

    await main()

    const { calls } = vi.mocked(promptAction).mock
    expect(calls.length).toBeGreaterThan(0)
    const call = calls[0]
    expect(call[0]).toContain('skills')
    expect(call[1]).toBe('')
  })
})
