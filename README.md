# kotoba

The Japanese lookup that **yomu** and **tsundoku** share: tokenizing,
furigana, romaji, name merging, and JMdict. Extracted from yomu on 2026-09-23
so neither app copies the other (tsundoku's `doc/ARCHITECTURE.md`, "Kumiko and
yomu").

It's a source package, not a published one: apps depend on it by path,

```json
"kotoba": "link:../kotoba"
```

and their bundler (Vite) compiles its TypeScript like their own. Both apps and
kotoba run on the workstation; nothing fetches it from anywhere.

## Two halves

| Import          | Runs in     | What                                                                                           |
| --------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `kotoba`        | the browser | `tokenize` (kuromoji), `furigana`, `toHiragana`, `toRomaji`, `applyNames`, `setDictionaryPath` |
| `kotoba/server` | the server  | `lookup`, `lookupForm`, `dictionaryAvailable`, `setJmdictPath` (JMdict in SQLite)              |

**Tokenizing runs in the browser** on purpose: it's per line and CPU-bound,
and the reading device has the cores. **Lookup runs on the server**: once per
tap, one indexed query, and shipping 60MB of JMdict JSON to every session to
avoid that would be the wrong trade. Never import `kotoba/server` from browser
code.

## Setting up an app

1. `"kotoba": "link:../kotoba"`, then `yarn install` in kotoba once (it has its
   own `node_modules`: kuromoji and better-sqlite3).
2. Serve kuromoji's dictionary yourself: `kotoba-sync-dict static/dict` (in the
   app's `prepare`), and gitignore `static/dict`. ~18MB of `.dat.gz`, never from
   a CDN: the lookup exists to work while reading. If it's served somewhere
   other than `/dict/`, call `setDictionaryPath()` before the first `tokenize`.
   A service worker must not precache it.
3. Build JMdict once, somewhere both apps can read:

   ```sh
   kotoba-build-dict --out ~/.local/share/kotoba/jmdict.db   # ~74MB, ~8s
   ```

   and point the app at it with `KOTOBA_JMDICT` (or `setJmdictPath()`). Without
   it, lookups answer nothing rather than failing.

## What it doesn't do

- **Deinflection** of its own: kuromoji's base form already turns 見開かれて
  into 見開く, and `lookup` tries the lemma, then the surface, then the reading.
- **Pitch accent and frequency**: no data yet.
- **A known-words model**: yomu's phase 5, when there's reading to count.

## Working on it

```sh
yarn run check    # tsc
yarn run lint     # prettier
yarn run test     # vitest; the JMdict tests run when KOTOBA_JMDICT (or data/jmdict.db) exists
```

The tests came with the code from yomu, and the lines they check are real ones
from yomu's captures.
