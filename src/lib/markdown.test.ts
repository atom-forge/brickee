// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { fromMarkdown, fromStored, inline, toMarkdown, toStored } from './markdown';
import { table } from './plugins';
import type { Block, StoredBlock } from './types';

/** Blocks as short strings: type, +indent, (lang) or {props}, then the html. */
const show = (blocks: Block[]) =>
	blocks.map((b) => {
		const extra = b.type === 'plugin' ? `[${b.plugin}] ${JSON.stringify(b.props)}` : b.html;
		const meta = b.type === 'code' && b.props?.lang ? `(${b.props.lang})` : b.type === 'ol' && b.props ? JSON.stringify(b.props) : '';
		return `${b.type}${b.indent ? '+' + b.indent : ''}${meta}${b.type === 'todo' ? (b.checked ? '[x]' : '[ ]') : ''}: ${extra}`;
	});
const md = (src: string) => show(fromMarkdown(src));
const out = (stored: StoredBlock[]) => toMarkdown(stored.map(fromStored));
/** Markdown -> blocks -> stored -> blocks -> markdown. */
const roundTrip = (src: string) => toMarkdown(fromMarkdown(src).map(toStored).map(fromStored));

describe('inline', () => {
	it('bold, italic and both', () => {
		expect(inline('**b** *i* ***bi***')).toBe('<b>b</b> <i>i</i> <b><i>bi</i></b>');
		expect(inline('__b__ _i_ ___bi___')).toBe('<b>b</b> <i>i</i> <b><i>bi</i></b>');
	});
	it('no intraword underscore emphasis', () => {
		expect(inline('snake_case_name and 2*3*4')).toBe('snake_case_name and 2<i>3</i>4');
	});
	it('links: balanced parentheses, titles, unsafe targets', () => {
		expect(inline('[w](https://en.wikipedia.org/wiki/Foo_(bar))')).toBe('<a href="https://en.wikipedia.org/wiki/Foo_(bar)">w</a>');
		expect(inline('[a](https://x.y "title")')).toBe('<a href="https://x.y">a</a>');
		expect(inline('[a](javascript:alert(1))')).toBe('[a](javascript:alert(1))');
		expect(inline('[a](/page?x=1&y=2)')).toBe('<a href="/page?x=1&amp;y=2">a</a>');
	});
	it('a link target keeps its underscores and stars', () => {
		expect(inline('[x](https://a.b/_c_/*d*)')).toBe('<a href="https://a.b/_c_/*d*">x</a>');
	});
	it('autolinks, images, footnote references', () => {
		expect(inline('<https://x.y> <me@x.y>')).toBe('<a href="https://x.y">https://x.y</a> <a href="mailto:me@x.y">me@x.y</a>');
		expect(inline('![alt](https://x.y/i.png)')).toBe('<a href="https://x.y/i.png">alt</a>');
		expect(inline('note[^1]')).toBe('note<sup>1</sup>');
	});
	it('code spans of any length', () => {
		expect(inline('`` a`b ``')).toBe('<code>a`b</code>');
		expect(inline('`*x*` and **`y`**')).toBe('<code>*x*</code> and <b><code>y</code></b>');
		expect(inline('a ` b')).toBe('a ` b');
	});
	it('every punctuation escape', () => {
		expect(inline('\\_ \\| \\# \\* \\! \\(')).toBe('_ | # * ! (');
		expect(inline('`\\*`')).toBe('<code>\\*</code>');
	});
	it('inline html: marks kept, other tags dropped', () => {
		expect(inline('<strong>b</strong> <em>i</em> <del>d</del> <u>u</u> a<br>b <kbd>K</kbd> <span class="x">s</span>')).toBe(
			'<b>b</b> <i>i</i> <strike>d</strike> <u>u</u> a<br>b K s'
		);
		expect(inline('a < b > c')).toBe('a &lt; b &gt; c');
	});
	it('inline html is always balanced', () => {
		expect(inline('<b>open')).toBe('<b>open</b>');
		expect(inline('<b><i>x</b></i> y')).toBe('<b><i>x</i></b> y');
		expect(inline('stray</em> close')).toBe('stray close');
		expect(inline('<a href="https://x.y?a=1&b=2">t</a>')).toBe('t');
	});
	it('autolinks keep their query strings', () => {
		expect(inline('<https://x.y/?a=1&b=2>')).toBe('<a href="https://x.y/?a=1&amp;b=2">https://x.y/?a=1&amp;b=2</a>');
	});
});

describe('fromMarkdown', () => {
	it('fences: longer fences and tildes', () => {
		expect(md('````md\nHere:\n```js\nconst a = 1;\n```\n````\nafter')).toEqual([
			'code(md): Here:<br>```js<br>const a = 1;<br>```',
			'p: after'
		]);
		expect(md('~~~js\ncode\n~~~')).toEqual(['code(js): code']);
		expect(md('```\nunclosed')).toEqual(['code: unclosed']);
	});
	it('indented code', () => {
		expect(md('    let x = 1;\n    let y = 2;\n\ntext')).toEqual(['code: let x = 1;<br>let y = 2;', 'p: text']);
	});
	it('headings: setext, closing hashes, empty, no space', () => {
		expect(md('Title\n=====\n\nSub\n---')).toEqual(['h1: Title', 'h2: Sub']);
		expect(md('## Title ##\n#\n#hashtag\n# C#')).toEqual(['h2: Title', 'h1: ', 'p: #hashtag', 'h1: C#']);
	});
	it('paragraph lines are kept as line breaks', () => {
		expect(md('first line\nsecond line\n\nnext')).toEqual(['p: first line<br>second line', 'p: next']);
		expect(md('hard  \nbreak\\\nend')).toEqual(['p: hard<br>break<br>end']);
	});
	it('quotes: one block per paragraph, nested ones deeper', () => {
		expect(md('> one\n> two\n>\n> second\n>> inner\nlazy')).toEqual(['quote: one<br>two', 'quote: second', 'quote+1: inner<br>lazy']);
	});
	it('lists nest by their markers, not by a fixed width', () => {
		expect(md('1. one\n   - under one\n2. two')).toEqual(['ol: one', 'ul+1: under one', 'ol: two']);
		expect(md('1. one\n  - two spaces still nest')).toEqual(['ol: one', 'ul+1: two spaces still nest']);
		expect(md('- a\n    - b\n        - c\n- d')).toEqual(['ul: a', 'ul+1: b', 'ul+2: c', 'ul: d']);
		expect(md('- item\n  more of it\n\n  continued')).toEqual(['ul: item<br>more of it', 'p+1: continued']);
		expect(md('- [ ] todo\n* [x] done\n+ plus')).toEqual(['todo[ ]: todo', 'todo[x]: done', 'ul: plus']);
	});
	it('a numbered list keeps its start', () => {
		expect(md('5. five\n6. six\n\ntext\n\n1. one')).toEqual(['ol{"start":5}: five', 'ol: six', 'p: text', 'ol: one']);
	});
	it('code in a list', () => {
		expect(md('- item\n  ```js\n  x\n  ```')).toEqual(['ul: item', 'code+1(js): x']);
	});
	it('reference links and footnotes', () => {
		expect(md('[a][1], [B][] and [c]\n\n[1]: https://x.y\n[b]: /b "t"\n[c]: <https://c.d>')).toEqual([
			'p: <a href="https://x.y">a</a>, <a href="/b">B</a> and <a href="https://c.d">c</a>'
		]);
		expect(md('text[^1]\n\n[^1]: the note')).toEqual(['p: text<sup>1</sup>', 'p: <sup>1</sup> the note']);
	});
	it('rules and html lines', () => {
		expect(md('a\n\n* * *\n\n<div>\nb\n</div>')).toEqual(['p: a', 'hr: ', 'p: b']);
	});
	it('GFM tables go to a plugin that takes them, or stay text', () => {
		const src = '| Name | Price |\n|:-----|------:|\n| Tea | €2 \\| €3 |\n| **Cake** |';
		expect(show(fromMarkdown(src, { plugins: [table] }))).toEqual([
			'plugin: [table] {"rows":[["Name","Price"],["Tea","€2 | €3"],["**Cake**",""]],"heads":["top"],"align":["left","right"]}'
		]);
		expect(md('| a | b |\n|---|---|\n| 1 | 2 |')).toEqual(['p: | a | b |<br>|---|---|<br>| 1 | 2 |']);
	});
});

describe('toMarkdown', () => {
	it('nests under a numbered item by its marker width', () => {
		expect(out([{ type: 'md:ol', indent: 0, text: 'one' }, { type: 'md:ul', indent: 1, text: 'nested' }])).toBe('1. one\n   - nested');
		const ten = Array.from({ length: 10 }, (_, i): StoredBlock => ({ type: 'md:ol', indent: 0, text: `x${i}` }));
		expect(out([...ten, { type: 'md:ul', indent: 1, text: 'under ten' }]).split('\n').slice(-2)).toEqual(['10. x9', '    - under ten']);
	});
	it('a code block with fences inside gets a longer fence', () => {
		expect(out([{ type: 'md:code', indent: 0, text: 'a\n```\nb', props: { lang: 'md' } }])).toBe('````md\na\n```\nb\n````');
	});
	it('escapes what would read as markup', () => {
		expect(out([{ type: 'md:p', indent: 0, text: '\\_not italic\\_ snake_case' }])).toBe('\\_not italic\\_ snake_case');
		expect(out([{ type: 'md:p', indent: 0, text: '1. not a list\n# not a heading' }])).toBe('1\\. not a list\\\n\\# not a heading');
	});
	it('quotes in a row stay one quote; nested quotes', () => {
		expect(out([{ type: 'md:quote', indent: 0, text: 'a' }, { type: 'md:quote', indent: 0, text: 'b' }, { type: 'md:quote', indent: 1, text: 'c' }])).toBe(
			'> a\n>\n> b\n>\n> > c'
		);
	});
	it('line breaks inside blocks', () => {
		expect(out([{ type: 'md:ul', indent: 0, text: 'a\nb' }, { type: 'md:quote', indent: 0, text: 'c\nd' }])).toBe('- a\\\n  b\n\n> c\\\n> d');
	});
	it('a start number', () => {
		expect(out([{ type: 'md:ol', indent: 0, text: 'five', props: { start: 5 } }, { type: 'md:ol', indent: 0, text: 'six' }])).toBe('5. five\n6. six');
	});
});

describe('round trip', () => {
	const cases = [
		'# Title\n\nSome **bold**, *italic*, ~~gone~~, `code`, <u>under</u> and a [link](https://x.y/a_(b)).',
		'1. one\n   - nested\n     - deeper\n2. two\n\n   continued under two',
		'- [x] done\n- [ ] open',
		'> quote line\\\n> second line\n>\n> next paragraph',
		'````md\n```js\nx\n```\n````',
		'5. five\n6. six',
		'Line one\\\nline two',
		'1\\. not a list, snake_case and \\_emphasis-like\\_'
	];
	for (const src of cases) it(JSON.stringify(src.slice(0, 40)), () => expect(roundTrip(src)).toBe(src));
});

// Hostile input must not freeze the tab: every pattern stays linear. The limit is generous for slow CI machines; the
// quadratic versions took seconds to minutes at this size.
describe('linear on hostile input', () => {
	const n = 100_000;
	const hostile: Record<string, string> = {
		'open tags': '<a x>'.repeat(n / 5),
		'unclosed marks': '<b>x'.repeat(n / 4),
		brackets: '['.repeat(n),
		images: '!['.repeat(n / 2),
		'link targets': '[a](x'.repeat(n / 5),
		'unclosed bold': '**a '.repeat(n / 4),
		'unclosed underscores': '_a '.repeat(n / 3),
		backticks: '`` a'.repeat(n / 4),
		footnotes: '[^'.repeat(n / 2)
	};
	for (const [name, src] of Object.entries(hostile))
		it(`inline: ${name}`, () => {
			const t = performance.now();
			inline(src);
			expect(performance.now() - t).toBeLessThan(1000);
		});
	const lines: Record<string, string> = {
		'heading with spaces': '# a' + ' '.repeat(n) + '#x',
		'spaces inside a line': 'a' + ' \t'.repeat(n / 2) + 'x',
		'brackets with references': '['.repeat(n) + '\n\n[a]: /x'
	};
	for (const [name, src] of Object.entries(lines))
		it(`fromMarkdown: ${name}`, () => {
			const t = performance.now();
			fromMarkdown(src);
			expect(performance.now() - t).toBeLessThan(1000);
		});
});
