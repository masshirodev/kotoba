# Testing

## Suite

vitest over `tests/*.test.ts`, configured in `vitest.config.ts`. The tests came
with the code from yomu, and the lines they check are real ones from yomu's
captures.

Two files depend on data that is not committed and skip themselves without it:

| File                          | Needs                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `tests/tokenize.integration…` | kuromoji's own dictionary under `node_modules/@patdx/kuromoji/dict` (`yarn install`) |
| `tests/dict.test.ts`          | JMdict in SQLite: `KOTOBA_JMDICT`, or `data/jmdict.db` (`yarn run build:dict`)       |

CI has no JMdict, so `src/server/dict.ts` is barely covered there. That is why
the floor is measured without it.

## Commands

| Command                  | What                                                            |
| ------------------------ | --------------------------------------------------------------- |
| `yarn run check`         | `tsc --noEmit`                                                  |
| `yarn run lint`          | Prettier check, then ESLint (with typescript-eslint)            |
| `yarn run format`        | Prettier, writing                                               |
| `yarn run test`          | The suite                                                       |
| `yarn run test:coverage` | The suite with V8 coverage over `src/`, failing below the floor |

Always `yarn run <name>`: Yarn 1 has a builtin `check` that exits 0 having
checked nothing, and the habit is what keeps that from biting.

**A change here changes yomu and tsundoku** (they link kotoba by path). Before
pushing, run their `yarn run check` and `yarn run test` too. CI runs yomu's
against every push; tsundoku is private, so its suite is yours to run.

## Coverage

**The floor is 65%** for lines, branches and functions. It is the
`thresholds` in `vitest.config.ts` and `floor` in `.hajime.json`, which must
agree, and it is enforced at every push and in CI.

It is what the suite held when kotoba came under hajime (2026-10-28), measured
as CI runs it, without JMdict: lines 81.9%, branches 81.39%, functions
65.78%, statements 80.53%. With JMdict present the same suite holds 88.68%,
87.2%, 78.94%. The floor only rises: a change that lowers coverage adds tests
in the same commit, and raising it is a change to both files at once.

kotoba is not on hajime's `node --test` floor (95%, flags in the
`test:coverage` script): its runner is vitest, so `.hajime.json` skips that
one check and says where the floor lives instead.

## Where each check runs

| Check                    | pre-commit   | pre-push | CI  |
| ------------------------ | ------------ | -------- | --- |
| Prettier, ESLint         | staged files | tree     | yes |
| `tsc`                    |              |          | yes |
| Agent instruction budget | yes          |          |     |
| Hooks armed              |              | yes      |     |
| Suite + 65% coverage     |              | yes      | yes |
| `hajime check --offline` |              | yes      |     |
| yomu's check and suite   |              |          | yes |

## Git hooks

| Hook         | Runs                                                           | Skip flags                                             |
| ------------ | -------------------------------------------------------------- | ------------------------------------------------------ |
| `pre-commit` | lint-staged (ESLint, Prettier), `agent-docs-budget`            | `SKIP_LINT SKIP_FORMAT SKIP_AGENT_DOCS SKIP_ALL`       |
| `pre-push`   | hooks armed, `lint`, `test:coverage`, `hajime check --offline` | `SKIP_HOOKS SKIP_LINT SKIP_TESTS SKIP_HAJIME SKIP_ALL` |
| `commit-msg` | refuses co-author trailers, `Claude-Session`, robot emoji      | `SKIP_COAUTHOR SKIP_ALL`                               |

The flags exist for the owner; an agent makes the hooks pass instead.

A worktree has no `.husky/_` until `npx husky` has run in it, and git then
runs no hook without saying so; `yarn run hooks:check` is the check.
