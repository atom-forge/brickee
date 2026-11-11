import { describe, expect, it } from 'vitest';
import { matchMark } from './automark';

const m = (text: string, closing = false) => {
	const r = matchMark(text, closing);
	return r && { tag: r.tag, text: r.text, src: text.slice(r.start, r.end), ...(r.href ? { href: r.href } : {}) };
};

describe('matchMark', () => {
	it('bold, italic, strike after a space or punctuation', () => {
		expect(m('say **Bold** ')).toEqual({ tag: 'b', text: 'Bold', src: '**Bold**' });
		expect(m('say __Bold__,')).toEqual({ tag: 'b', text: 'Bold', src: '__Bold__' });
		expect(m('an *idea*.')).toEqual({ tag: 'i', text: 'idea', src: '*idea*' });
		expect(m('an _idea_!')).toEqual({ tag: 'i', text: 'idea', src: '_idea_' });
		expect(m('was ~~old~~ ')).toEqual({ tag: 'strike', text: 'old', src: '~~old~~' });
	});
	it('only once the closing marker is followed by a boundary, or with Enter', () => {
		expect(m('say **Bold**')).toBeNull();
		expect(m('say **Bold**', true)).toEqual({ tag: 'b', text: 'Bold', src: '**Bold**' });
		expect(m('say **Bold*')).toBeNull();
	});
	it('code on its closing backtick, links on their closing parenthesis', () => {
		expect(m('run `npm i`')).toEqual({ tag: 'code', text: 'npm i', src: '`npm i`' });
		expect(m('see [docs](https://x.y/a)')).toEqual({ tag: 'a', text: 'docs', src: '[docs](https://x.y/a)', href: 'https://x.y/a' });
		expect(m('see [docs](x.y/a)')).toEqual({ tag: 'a', text: 'docs', src: '[docs](x.y/a)', href: 'https://x.y/a' });
		expect(m('see [x](javascript:alert)')).toBeNull();
		expect(m('an image ![x](https://x.y)')).toBeNull();
	});
	it('stays text where markdown would not mark it', () => {
		expect(m('2*3*4 ')).toBeNull();
		expect(m('snake_case_name ')).toBeNull();
		expect(m('a ** b ** ')).toBeNull();
		expect(m('a \\*not\\* ')).toBeNull();
		expect(m('\\**not** ')).toBeNull();
		expect(m('``')).toBeNull();
	});
	it('stays fast in a long paragraph', () => {
		const long = 'word '.repeat(20000) + '**x';
		const t = performance.now();
		for (let i = 0; i < 50; i++) matchMark(long + ' ');
		expect(performance.now() - t).toBeLessThan(500);
	});
});
