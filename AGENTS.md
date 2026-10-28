# AGENTS.md

kotoba is a source package shared by `~/projects/yomu` and
`~/projects/tsundoku`, linked by path (`link:../kotoba`). Read README.md, and
`AGENTS.local.md` beside this file whenever it exists: it is gitignored and
says what is true of this checkout on this machine.

- A change here changes both apps. Run their checks and tests, not only
  kotoba's, before pushing. CI (`.github/workflows/ci.yml`) runs kotoba's and
  yomu's on every push; tsundoku is private, so its suite is still yours to run.
- Keep the two halves apart: `src/` (browser-safe) never imports
  `src/server/`, and nothing in `src/server/` is browser code.
- Relative imports carry `.ts`, so Node's type stripping can run the scripts
  and the server half directly.
- Tests are vitest, in `tests/`. The coverage floor is **65%** lines, branches
  and functions (`.hajime.json` `floor`, `vitest.config.ts`), and only rises;
  `doc/TESTING.md` says what runs where.
- The repository is under hajime (`.hajime.json`): `hajime check --offline`
  runs at every push.
- Push to `main`. No co-author on commits (the `commit-msg` hook refuses one).
