/**
 * kotoba: the Japanese lookup yomu and tsundoku share (README.md).
 *
 * This entry is browser-safe: tokenising (kuromoji, in the browser),
 * furigana, romaji, name merging, and ranking looked-up words as flashcard
 * candidates (mining). The dictionary lookup is server-only:
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
export {
	isMineable,
	rankCandidates,
	SESSION_WEIGHT,
	type Candidate,
	type LookupRecord
} from './mining.ts';
export {
	annotateSentence,
	bracketFurigana,
	composeCard,
	type CardDraft,
	type Enrichment,
	type SentenceToken
} from './card.ts';
