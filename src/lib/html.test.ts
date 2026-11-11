// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { fromHtml, markdownFromHtml } from './html';
import { table } from './plugins';

const md = (html: string) => markdownFromHtml(html);

describe('markdownFromHtml', () => {
	it('headings, paragraphs and inline marks', () => {
		expect(md('<h2>Title</h2><p>Some <b>bold</b>, <em>italic</em>, <u>under</u>, <del>gone</del>, <code>x</code> and <a href="https://x.y">a link</a>.</p>')).toBe(
			'## Title\n\nSome **bold**, *italic*, <u>under</u>, ~~gone~~, `x` and [a link](https://x.y).'
		);
	});
	it('whitespace collapses, <br> breaks a line, marks keep their spaces outside', () => {
		expect(md('<p>one\n   two<br>three <b> four </b></p>')).toBe('one two\nthree **four**');
	});
	it('Google Docs: a bold wrapper with normal weight, styled spans', () => {
		const docs = '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1"><p><span style="font-weight:700">Bold</span> and <span style="font-style:italic">italic</span> and <span style="text-decoration:line-through">gone</span></p></b>';
		expect(md(docs)).toBe('**Bold** and *italic* and ~~gone~~');
		expect(md('<b style="font-weight:normal"><h2>T</h2><ul><li>a</li></ul></b>')).toBe('## T\n\n- a');
	});
	it('nested lists, numbered with their start, to-dos from checkboxes', () => {
		expect(md('<ol start="3"><li>three<ul><li>nested</li></ul></li><li>four</li></ol>')).toBe('3. three\n   - nested\n4. four');
		expect(md('<ul><li><input type="checkbox" checked> done</li><li><input type="checkbox"> open</li></ul>')).toBe('- [x] done\n- [ ] open');
	});
	it('code, quotes, rules', () => {
		expect(md('<pre><code class="language-ts">const a = 1;\nconst b = 2;\n</code></pre>')).toBe('```ts\nconst a = 1;\nconst b = 2;\n```');
		expect(md('<blockquote><p>one</p><p>two</p></blockquote><hr>')).toBe('> one\n>\n> two\n\n---');
	});
	it('tables: header, alignment, pipes escaped', () => {
		expect(md('<table><tr><th>A</th><th style="text-align:right">B</th></tr><tr><td>1 | 2</td><td><b>3</b></td></tr></table>')).toBe(
			'| A | B |\n| --- | --: |\n| 1 \\| 2 | **3** |'
		);
	});
	it('images become links; scripts, styles and controls are dropped', () => {
		expect(md('<p>see <img src="https://x.y/i.png" alt="pic"><script>alert(1)</script><style>p{}</style><button>no</button></p>')).toBe('see [pic](https://x.y/i.png)');
	});
	it('text that looks like markdown stays text', () => {
		expect(md('<p># not a heading</p><p>1. not a list</p><p>a *star* and snake_case</p>')).toBe('\\# not a heading\n\n1\\. not a list\n\na \\*star\\* and snake_case');
	});
});

describe('fromHtml', () => {
	it('gives blocks, a table to a plugin that takes it', () => {
		const blocks = fromHtml('<h1>T</h1><ul><li>a</li></ul><table><tr><th>x</th></tr><tr><td>1</td></tr></table>', { plugins: [table] });
		expect(blocks.map((b) => (b.type === 'plugin' ? b.plugin : b.type))).toEqual(['h1', 'ul', 'table']);
	});
	it('a link with an unsafe target stays text', () => {
		expect(fromHtml('<p><a href="javascript:alert(1)">x</a></p>')[0].html).toBe('[x](javascript:alert(1))');
	});
});
