# 典型模板

## 批量文件处理

```typescript
import { glob, runConcurrent, echo, wrapList } from "fire-keeper";

const fn = async (source: string | string[], { concurrency = 5 } = {}) => {
  const listSource = await glob(source);
  if (!listSource.length) {
    echo("fn", `no files found matching ${wrapList(source)}`);
    return;
  }
  await runConcurrent(
    concurrency,
    listSource.map((src) => async () => {
      echo("fn", `processing ${src}`);
      // 处理逻辑
    }),
  );
  echo("fn", `processed ${listSource.length} files`);
};
```

## 复制文件（自定义文件名）

```typescript
import { copy } from "fire-keeper";

await copy("src.ts", "dist", { filename: "index.js" });
await copy("*.ts", "dist", { filename: (f) => f.replace(".ts", ".js") });
```

## 读取文件（类型安全）

```typescript
import { read } from "fire-keeper";

const config = await read<{ port: number }>("config.json");
const data = await read("data.yaml"); // Record<string, unknown>
const text = await read("log.txt"); // string
const buffer = await read("image.png", { raw: true }); // Buffer
```

## 交互式提示

```typescript
import { prompt } from "fire-keeper";

const name = await prompt({ type: "text", message: "Name?" });
const confirmed = await prompt({ type: "confirm", message: "Continue?" });
const env = await prompt({ type: "select", list: ["dev", "prod"] });
const version = await prompt({ type: "number", min: 0, max: 10 });
```

## 读取配置

```typescript
import { read } from "fire-keeper";

const config = await read("config.yaml"); // 自动解析 YAML
```

## 文件备份

```typescript
import { backup, recover } from "fire-keeper";

await backup("data.txt"); // data.txt.bak
await recover("data.txt"); // 从 .bak 恢复
```

## 跨平台执行

```typescript
import { exec } from "fire-keeper";

const [exitCode, lastOutput, allOutputs] = await exec("npm run build");
```

## 路径简化

```typescript
import { root, home } from "fire-keeper";

const projectFile = root("src", "index.js"); // /project/src/index.js
const userConfig = home(".config", "app.json"); // ~/.config/app.json
```
