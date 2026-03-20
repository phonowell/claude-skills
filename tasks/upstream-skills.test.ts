import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildCloneCommand,
  findSkillPathFromTree,
  getSkillsShCandidates,
  parseProxyCandidatesFromConfig,
  parseSkillsShPage,
  resolveRemoteSource,
} from './upstream-skills.js'

const originalFetch = globalThis.fetch

describe('parseSkillsShPage', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('builds fallback candidates for collapsed skills repos', () => {
    expect(getSkillsShCandidates('anthropics/skill-creator')).toEqual([
      'anthropics/skill-creator',
      'anthropics/skills/skill-creator',
    ])
  })

  it('parses clash proxy candidates from config', () => {
    expect(
      parseProxyCandidatesFromConfig(
        ['mixed-port: 7897', 'port: 7890', 'socks-port: 7891'].join('\n'),
      ),
    ).toEqual([
      { source: 'mixed-port:7897', url: 'http://127.0.0.1:7897' },
      { source: 'port:7890', url: 'http://127.0.0.1:7890' },
      { source: 'socks-port:7891', url: 'socks5://127.0.0.1:7891' },
    ])
  })

  it('builds clone command with proxy env when provided', () => {
    expect(
      buildCloneCommand(
        'https://github.com/anthropics/skills',
        '/tmp/repo',
        'http://127.0.0.1:7897',
      ),
    ).toContain('HTTP_PROXY="http://127.0.0.1:7897"')
  })

  it('finds hidden grouped skill paths from git tree output', () => {
    expect(
      findSkillPathFromTree(
        'openai-docs',
        ['README.md', 'skills/.system/openai-docs/SKILL.md'].join('\n'),
      ),
    ).toBe('skills/.system/openai-docs')
  })

  it('resolves repo page installs from skills.sh url shape', () => {
    const source = parseSkillsShPage(
      'vercel-labs/agent-browser',
      `
        <a href="https://github.com/vercel-labs/agent-browser">GitHub</a>
        <code>npx skills add vercel-labs/agent-browser</code>
      `,
    )

    expect(source).toEqual({
      repoUrl: 'https://github.com/vercel-labs/agent-browser',
      skillName: 'agent-browser',
    })
  })

  it('resolves nested skill pages from install command', () => {
    const source = parseSkillsShPage(
      'anthropics/skill-creator',
      `
        <code>
          npx skills add https://github.com/anthropics/skills --skill skill-creator
        </code>
      `,
    )

    expect(source).toEqual({
      repoUrl: 'https://github.com/anthropics/skills',
      skillName: 'skill-creator',
    })
  })

  it('fetches and parses skills.sh pages', async () => {
    globalThis.fetch = vi.fn((input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith('/dimillian/github'))
        return Promise.resolve(new Response('', { status: 404 }))

      if (url.endsWith('/dimillian/skills/github')) {
        return Promise.resolve(
          new Response(
            '<a href="https://github.com/dimillian/skills">GitHub</a><code>npx skills add https://github.com/dimillian/skills --skill github</code>',
            { status: 200 },
          ),
        )
      }

      return Promise.resolve(new Response('', { status: 500 }))
    }) as unknown as typeof fetch

    await expect(resolveRemoteSource('dimillian/github')).resolves.toEqual({
      repoUrl: 'https://github.com/dimillian/skills',
      skillName: 'github',
    })
  })
})
