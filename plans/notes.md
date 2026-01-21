# Notes: Folder-level skill symlink mirroring

- Current `src/index.ts` syncs files via `collectAllFiles` + `syncFile` with
  `promptAction`/`overwriteFile`, then `linkSkills` symlinks
  `~/.claude/skills` to `~/.codex/.trae-cn/.cursor`.
- `linkSkills` already normalizes win32 `readlink` output and uses `junction`
  when `process.platform === 'win32'`.
- Tests in `src/index.test.ts` cover prompt/copy behavior and win32 link
  normalization; these will need to be replaced with folder-level link tests.
- fire-keeper provides `glob`, `stat`, `remove`, `mkdir`, `home`, `getName`,
  `normalizePath`, but no symlink API; use `node:fs/promises` for
  `lstat/readlink/symlink`.
- Open questions: handling of extra target folders not in source, hidden folders
  under `./skills`, and whether to backup before removal.
- Decisions: remove only entries that collide with source folders (no backups),
  skip hidden directories under `./skills`.
