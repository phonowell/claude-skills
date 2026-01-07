import { glob } from 'fire-keeper'

const main = async () => {
  const list = await glob('.claude/**/*')
  console.log(list)
}

export default main
