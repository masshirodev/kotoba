import type { FuriganaSegment } from './furigana.ts';
import { toRomaji } from './romaji.ts';

/**
 * Turning a mined word into a card someone learning to read can actually use.
 *
 * The first cards this project produced were entirely Japanese -- 「ボク」 on the
 * front, and on the back a reading, a gloss, and the sentence it was met in,
 * still unreadable. A card you cannot read is not a card, it is a reminder that
 * you could not read something.
 *
 * The division of labour here is the whole design, and it runs the other way
 * from "ask the model for everything":
 *
 *   Readings are computed, never generated. Kana, romaji and furigana come from
 *   JMdict and the tokenizer, which are right by construction. A model asked for
 *   a reading will occasionally invent a plausible one, and a wrong reading on a
 *   flashcard is worse than no card at all -- it is drilled until it sticks.
 *
 *   Meaning in context is generated, because nothing else can do it. JMdict
 *   gives 諦める eight senses and no way to know which one this sentence used;
 *   the dictionary cannot tell you that ボク is a boyish first-person that this
 *   girl uses deliberately. That is what the model is for.
 */

/** What the model is asked to supply, and nothing more. */
export type Enrichment = {
	/** The sense that actually applies here, in a few words. */
	meaning: string;
	/** A natural English rendering of the sentence the word was met in. */
	sentence: string;
	/**
	 * The same sentence read structurally, in Japanese order.
	 *
	 * A natural translation tells you what the line meant. It does not tell you
	 * how the Japanese got there, and that is the half you need to read the
	 * *next* line -- 嫌悪の色を宿す arrives as 'harboured a deep-rooted loathing',
	 * which hides that 色 is a tinge and 宿す is to house. Reading both is the
	 * sandwich technique, and for someone decoding rather than producing it is
	 * the useful one.
	 */
	literal: string;
	/** Register, nuance, or why this word is the one used. One or two sentences. */
	note: string;
};

export type SentenceToken = {
	surface: string;
	/** Hiragana reading, or null when the tokenizer had none. */
	reading: string | null;
};

/**
 * Bracket notation, the form Lattice renders as ruby: 食[た]べる.
 *
 * Only kanji runs are annotated. Bracketing kana would put a reading over
 * characters that already are the reading, and Lattice refuses to render those
 * anyway -- the two rules are deliberately the same rule.
 */
export function bracketFurigana(segments: FuriganaSegment[]): string {
	return segments.map((s) => (s.ruby ? `${s.text}[${s.ruby}]` : s.text)).join('');
}

const HAN = /\p{Script=Han}/u;
const KANA_ONLY = /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u;
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

/**
 * Annotate a whole sentence from its tokens.
 *
 * A token contributes a reading only when it contains kanji and the reading
 * differs from the surface. Everything else is passed through untouched, so a
 * sentence of pure kana comes out exactly as it went in.
 */
export function annotateSentence(
	tokens: readonly SentenceToken[],
	align: (surface: string, reading: string | null) => FuriganaSegment[],
	names: readonly NameReading[] = []
): string {
	// Names are matched across tokens before anything else, because the tokenizer
	// gets them wrong and does so confidently. 桜羽 comes back as 桜(さくら) +
	// 羽(わ), so the sentence was annotated 桜[さくら]羽[わ] -- a reading the
	// reader would have learnt off a flashcard, and the wrong one. The name
	// thread already knows it is さくらば, so that wins.
	const known = names.filter((n) => n.reading).sort((a, b) => b.surface.length - a.surface.length);

	const out: string[] = [];

	for (let i = 0; i < tokens.length; i++) {
		const match = known.find((n) => {
			let span = '';
			for (let j = i; j < tokens.length && span.length < n.surface.length; j++) {
				span += tokens[j].surface;
			}
			return span === n.surface;
		});

		if (match) {
			let span = '';
			let j = i;
			while (j < tokens.length && span.length < match.surface.length) span += tokens[j++].surface;
			out.push(bracketFurigana(align(match.surface, match.reading)));
			i = j - 1;
			continue;
		}

		const t = tokens[i];
		if (!HAN.test(t.surface) || !t.reading || t.reading === t.surface) out.push(t.surface);
		else out.push(bracketFurigana(align(t.surface, t.reading)));
	}

	return out.join('');
}

/** A character name's recorded reading, which the tokenizer can't derive. */
export type NameReading = { surface: string; reading: string | null };

export type CardDraft = {
	lemma: string;
	front: string;
	back: string;
	tags: string;
};

/**
 * Compose the card.
 *
 * The front is the bare dictionary form. Putting the reading on it would make
 * every card a reading exercise the answer to which is printed on it; the point
 * of recall is that you supply the reading yourself.
 *
 * The dictionary form rather than the form that happened to appear, because a
 * card fronted 待っ or 気安く teaches an inflection as though it were a word,
 * and its romaji comes from the dictionary anyway -- the first cards read
 * `気安く  kiyasui`, which is two different words on one line. The inflected
 * form is still there, in the sentence, where it belongs.
 *
 * The back is ordered by what you need first when you have just failed: what it
 * means, then how it sounds, then the sentence, then why. Lattice preserves the
 * line breaks and renders the brackets as ruby.
 */
export function composeCard(input: {
	/** The dictionary form. This is the front of the card. */
	lemma: string;
	reading: string | null;
	wordSegments: FuriganaSegment[];
	glosses: string[];
	speaker: string | null;
	annotatedSentence: string | null;
	sentenceTranslation: string | null;
	enrichment: Enrichment | null;
	tags?: string;
}): CardDraft {
	const {
		lemma,
		reading,
		wordSegments,
		glosses,
		speaker,
		annotatedSentence,
		sentenceTranslation,
		enrichment
	} = input;

	const lines: string[] = [];

	// The meaning the model picked for this context leads, with the dictionary's
	// own glosses kept underneath rather than replaced -- the model chooses among
	// them, it does not get to overrule them.
	const meaning = enrichment?.meaning?.trim();
	if (meaning) lines.push(meaning);

	const dictionary = glosses.slice(0, 4).join('; ');
	if (dictionary && dictionary !== meaning) lines.push(dictionary);

	// Romaji only when it is actually romaji. toRomaji passes characters it cannot
	// convert straight through, so a word with no recorded reading -- 桜羽エマ has
	// no dictionary entry -- came out as the literal string `桜羽ema`, which is
	// not a pronunciation of anything.
	const romaji = toRomaji(reading && reading !== lemma ? reading : lemma);
	const sound = [bracketFurigana(wordSegments), CJK.test(romaji) ? '' : romaji]
		.filter(Boolean)
		.join('  ');
	if (sound) lines.push('', sound);

	if (annotatedSentence) {
		lines.push('');
		lines.push(speaker ? `${speaker}: ${annotatedSentence}` : annotatedSentence);
		// Structure first, then the natural reading. You have just read the
		// Japanese; the gloss shows how it parses, and the natural line shows what
		// that adds up to. The other order gives away the answer before the work.
		const literal = enrichment?.literal?.trim();
		if (literal) lines.push(`lit. ${literal}`);

		const english = enrichment?.sentence?.trim() || sentenceTranslation?.trim();
		if (english) lines.push(english);
	}

	const note = enrichment?.note?.trim();
	if (note) lines.push('', note);

	return {
		lemma,
		front: lemma,
		back: lines
			.join('\n')
			.replace(/\n{3,}/gu, '\n\n')
			.trim(),
		tags: input.tags ?? ''
	};
}
