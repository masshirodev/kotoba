/**
 * kotoba: the Japanese lookup yomu and tsundoku share (README.md).
 *
 * This entry is browser-safe: tokenising (kuromoji, in the browser),
 * furigana, romaji and name merging. The dictionary lookup is server-only:
 * `kotoba/server`.
 */
export {
	loadTokenizer,
	maybeGunzip,
	setDictionaryPath,
	toTokens,
	tokenize,
	type Token
} from './tokenize.ts';
export { furigana, toHiragana, type FuriganaSegment } from './furigana.ts';
export { toRomaji } from './romaji.ts';
export { applyNames, type NameEntry } from './names.ts';
