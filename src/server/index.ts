/**
 * kotoba's server side: JMdict lookup, from SQLite (README.md). Never import
 * this from browser code; the entry for that is `kotoba`.
 */
export {
	dictionaryAvailable,
	lookup,
	lookupForm,
	setJmdictPath,
	type Entry,
	type Sense
} from './dict.ts';
