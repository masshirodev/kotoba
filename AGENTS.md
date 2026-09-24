# AGENTS.md

kotoba is a source package shared by `~/projects/yomu` and
`~/projects/tsundoku`, linked by path (`link:../kotoba`). Read README.md.

- A change here changes both apps. Run their checks and tests, not only
  kotoba's, before pushing.
- Keep the two halves apart: `src/` (browser-safe) never imports
  `src/server/`, and nothing in `src/server/` is browser code.
- Relative imports carry `.ts`, so Node's type stripping can run the scripts
  and the server half directly.
- Push to `main`. No co-author on commits.
