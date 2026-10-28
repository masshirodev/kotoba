# Design

What Kotoba is for, what it deliberately is not, and the decisions that shape
it. A change that contradicts a decision here changes this file in the same
commit. README.md has the longer account of each.

## Goals

- One Japanese lookup for yomu and tsundoku (tokenizing, furigana, romaji,
  name merging, JMdict, mining candidates and cards), so neither app copies the
  other. Extracted from yomu on 2026-09-23.
- Works while reading, offline: kuromoji's dictionary is served by the app
  itself, never from a CDN.

## Non-goals

- A published package: apps depend on it by path (`link:../kotoba`) and
  compile its TypeScript with their own bundler.
- Deinflection of its own: kuromoji's base form already does it, and `lookup`
  tries the lemma, then the surface, then the reading.
- Pitch accent, frequency, and a known-words model: no data yet.
- An LLM: yomu's enrichment stays in yomu and arrives as `enrichment`.

## Decisions

- **Two halves.** `kotoba` is browser-safe; `kotoba/server` is the JMdict
  lookup and is never imported from browser code. Tokenizing is per line and
  CPU-bound, so it runs on the reading device; lookup is one indexed query per
  tap, so it runs on the server rather than shipping 60MB of JMdict to every
  session.
- **Relative imports carry `.ts`**, so Node's type stripping runs the scripts
  and the server half with no build step.
- **Lookups become candidates, not cards.** `rankCandidates` weights separate
  sessions above the raw count (`SESSION_WEIGHT`), and each app approves its
  cards in a batch.
- **The public API is the contract.** Both apps link it by path, so a change
  to an export is a change to both, checked against yomu's suite in CI.
