import {
  copy,
  echo,
  exec,
  getDirname,
  glob,
  isExist,
  prompt,
  root,
  runConcurrent,
} from 'fire-keeper'

import parseCliArgs from '../utils/parseCliArgs.js'

const PROJECT_NAME = root().split('/').slice(-1)[0] ?? ''

const ask = async () => {
  const [target] = await parseCliArgs()
  return (
    target ||
    prompt({
      message: 'Please provide a target',
      type: 'text',
    })
  )
}

const checkRepo = async (target: string) => {
  const dirname = root().replace(PROJECT_NAME, target)

  const exist = await isExist(dirname)
  if (exist) return

  const cmd = `git clone git@git.bilibili.co:bilicomic-activity/${target}.git ${dirname}`
  await exec(cmd)
}

const copyFiles = async (target: string) => {
  const list = await glob([
    './**/*',
    './.gitignore',
    './.npmrc',
    './.stylintrc',
    '!./**/*.zip',
    '!./**/.DS_Store',
    '!./.git/**/*',
    '!./dist/**/*',
    '!./node_modules/**/*',
  ])
  if (!list.length) return

  await runConcurrent(
    5,
    list.map((source) => async () => {
      const dirname = getDirname(source).replace(PROJECT_NAME, target)
      await copy(source, dirname, {
        concurrency: 1,
      })
    }),
  )
}

const execCommands = (target: string) =>
  exec([
    `cd ../${target}`,
    'pnpm i',
    'git add .',
    'git commit -m "feat: init"',
    'git push -u origin --all',
    'cd ../2025-01-basic',
  ])

const main = async () => {
  const target = await ask()

  if (!target) {
    echo('No target provided')
    return
  }

  await checkRepo(target)

  await copyFiles(target)

  await execCommands(target)
}

export default main
