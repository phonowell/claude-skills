# Implementation Plan: Folder-level skill symlinks

## Files
- `src/index.ts`
- `src/index.test.ts`
- `plans/task_plan.md`
- `plans/notes.md`

## Steps
1. Replace file-level `collectAllFiles`/`syncFile` with a helper that lists
   top-level skill directories under `./skills` (use `glob` + `stat` or
   `onlyDirectories`, filter ignores). Update around `src/index.ts:23`.
2. Add `ensureSkillsRoot` to remove existing symlinked `~/.*/skills` dirs and
   recreate them using `remove` + `mkdir`, relying on `lstat` to detect
   symlinks. Implement near `src/index.ts:86`.
3. Implement `linkSkillFolders` to, for each source folder and each target
   root, `lstat` the target entry, normalize win32 `readlink` output, remove
   non-matching entries, and create `symlink` (`junction` on win32). Replace
   existing `linkSkills` in `src/index.ts:86`.
4. Update `main` to call the new linking flow and remove prompt/copy imports.
   Update around `src/index.ts:154`.
5. Rewrite tests to mock `glob`, `stat`, `remove`, `mkdir`, and
   `fs/promises` symlink ops; add cases for legacy symlinked `skills` root
   cleanup and for existing copied folders being replaced with symlinks.
   Update `src/index.test.ts:1`.

## Technical Notes
- Use fire-keeper for `glob`, `stat`, `remove`, `mkdir`, `home`, `getName`,
  `normalizePath`; use `node:fs/promises` only for `lstat`, `readlink`,
  `symlink` since fire-keeper has no symlink API.
- Use a win32 `normalizeLinkPath` helper (strip `//?/` and `//?/UNC/`, lower
  case) before comparing `readlink` outputs.
- Only ensure links for folders present in `./skills`; leave unrelated target
  entries untouched unless they collide with those folders.

## Risks
- Windows symlink creation may still require admin if `junction` is not used
  (assumption).
- Removing existing folders may discard local changes; confirm whether backups
  are needed (assumption).
