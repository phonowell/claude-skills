import { normalizePath } from 'fire-keeper'

const main = () => {
  const path = normalizePath('~/.claude/skills')
  console.log('path:', path)
}

export default main
