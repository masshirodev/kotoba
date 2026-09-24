import { describe, expect, it } from 'vitest';
import { annotateSentence, bracketFurigana, composeCard } from '../src/card.ts';
import { furigana } from '../src/furigana.ts';

const align = (surface: string, reading: string | null) => furigana(surface, reading);

describe('bracketFurigana', () => {
	it('writes readings in the notation Lattice renders as ruby', () => {
		expect(bracketFurigana(furigana('奥歯', 'オクバ'))).toBe('奥歯[おくば]');
	});

	it('leaves okurigana outside the brackets', () => {
		// 食[た]べる, never 食べる[たべる] -- the same rule the reader's own furigana
		// follows, because a card and the reader must not disagree about a word.
		expect(bracketFurigana(furigana('食べる', 'タベル'))).toBe('食[た]べる');
	});

	it('adds nothing to a word that is already kana', () => {
		expect(bracketFurigana(furigana('ボク', 'ボク'))).toBe('ボク');
	});
});

describe('annotateSentence', () => {
	it('annotates only the tokens that contain kanji', () => {
		const tokens = [
			{ surface: 'ボク', reading: 'ぼく' },
			{ surface: 'は', reading: 'は' },
			{ surface: '諦め', reading: 'あきらめ' },
			{ surface: 'ない', reading: 'ない' }
		];
		expect(annotateSentence(tokens, align)).toBe('ボクは諦[あきら]めない');
	});

	it('passes an all-kana sentence through untouched', () => {
		const tokens = [
			{ surface: 'そう', reading: 'そう' },
			{ surface: 'です', reading: 'です' },
			{ surface: 'ね', reading: 'ね' }
		];
		expect(annotateSentence(tokens, align)).toBe('そうですね');
	});

	it('keeps a token whose reading is missing rather than dropping it', () => {
		// Unknown words are exactly the ones worth studying; losing them from the
		// sentence would quietly delete the interesting half of the card.
		const tokens = [
			{ surface: '桜羽', reading: null },
			{ surface: 'エマ', reading: 'えま' }
		];
		expect(annotateSentence(tokens, align)).toBe('桜羽エマ');
	});
});

describe('composeCard', () => {
	const base = {
		lemma: '諦める',
		reading: 'あきらめる',
		wordSegments: furigana('諦める', 'アキラメル'),
		glosses: ['to give up', 'to abandon'],
		speaker: '桜羽エマ',
		annotatedSentence: 'ボ、ボク諦[あきら]めないから！',
		sentenceTranslation: null,
		enrichment: {
			meaning: 'to give up (on something)',
			sentence: "I-I'm not giving up!",
			literal: 'I-I, because I will not give up!',
			note: 'Negated as 諦めない. She uses ボク, a boyish first person, which reads as bravado here.'
		}
	};

	it('keeps the front a bare word', () => {
		// A reading on the front makes every card a reading exercise with the answer
		// printed on it.
		expect(composeCard(base).front).toBe('諦める');
		expect(composeCard(base).front).not.toContain('[');
	});

	it('carries reading, romaji, sentence and note on the back', () => {
		const back = composeCard(base).back;
		expect(back).toContain('諦[あきら]める');
		expect(back).toContain('akirameru');
		expect(back).toContain('ボ、ボク諦[あきら]めないから！');
		expect(back).toContain("I-I'm not giving up!");
		expect(back).toContain('桜羽エマ');
		expect(back).toContain('boyish first person');
	});

	it('never emits three consecutive newlines', () => {
		// The back is built from optional blocks, and Lattice now renders newlines
		// literally, so a missing block used to leave a visible gap.
		const sparse = composeCard({
			...base,
			glosses: [],
			annotatedSentence: null,
			enrichment: { meaning: 'to give up', sentence: '', literal: '', note: '' }
		});
		expect(sparse.back).not.toMatch(/\n\n\n/u);
		expect(sparse.back.startsWith('\n')).toBe(false);
	});

	it('still produces a usable card with no enrichment at all', () => {
		// Enrichment goes through a provider that can be down. Falling back to the
		// dictionary card is worse than the enriched one and far better than none.
		const bare = composeCard({ ...base, enrichment: null });
		expect(bare.back).toContain('to give up; to abandon');
		expect(bare.back).toContain('諦[あきら]める');
		expect(bare.back).toContain('akirameru');
	});

	it('does not repeat the dictionary line when the model just echoed it', () => {
		const echoed = composeCard({
			...base,
			glosses: ['to give up'],
			enrichment: { meaning: 'to give up', sentence: '', literal: '', note: '' }
		});
		expect(echoed.back.match(/to give up/gu)).toHaveLength(1);
	});

	it('fronts the dictionary form, not the form that happened to appear', () => {
		// The first cards read `気安く  kiyasui` -- the inflected surface above the
		// dictionary form's romaji, which is two different words on one line.
		const card = composeCard({
			...base,
			lemma: '気安い',
			reading: 'きやすい',
			wordSegments: furigana('気安い', 'キヤスイ'),
			glosses: ['friendly'],
			annotatedSentence: '気安[きやす]く触[ふ]れないでほしい。'
		});

		expect(card.front).toBe('気安い');
		expect(card.back).toContain('気安[きやす]い');
		expect(card.back).toContain('kiyasui');
		// The inflected form is still there, in the sentence, where it belongs.
		expect(card.back).toContain('気安[きやす]く');
	});
});
