// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { fromMarkdown, fromStored, inline, toMarkdown, toStored } from './markdown';
import { inlineMath } from './math';

const o = { inlinePlugins: [inlineMath] };
const count = (html: string) => html.match(/data-inline="math"/g)?.length ?? 0;

describe('inline plugins', () => {
	it('render inside text', () => {
		const html = inline('a $x^2$ b', o);
		expect(count(html)).toBe(1);
		expect(html).toContain('data-md="$x^2$"');
		expect(html).toContain('<math');
	});
	it('never in code, on an escaped dollar, or on prices', () => {
		expect(count(inline('`$y$`', o))).toBe(0);
		expect(count(inline('\\$z$ x', o))).toBe(0);
		expect(count(inline('costs $5 or $10', o))).toBe(0);
		expect(count(inline('$ x $', o))).toBe(0);
	});
	it('not without the plugin', () => {
		expect(count(inline('a $x^2$ b'))).toBe(0);
	});
	it('the editor form is not editable text and converts back to markdown', () => {
		const [b] = fromMarkdown('see $x^2$ here', o);
		expect(b.html).toContain('contenteditable="false"');
		expect(toStored(b).text).toBe('see $x^2$ here');
		expect(toMarkdown([b])).toBe('see $x^2$ here');
	});
	it('LaTeX escapes inside survive the round trip', () => {
		expect(toStored(fromStored({ type: 'md:p', indent: 0, text: 'a $\\{x\\}$ b' }, o)).text).toBe('a $\\{x\\}$ b');
	});
	it('a typed dollar is escaped, so it never becomes a formula later', () => {
		const [b] = fromMarkdown('price \\$5 and $x$');
		expect(toStored(b).text).toBe('price \\$5 and \\$x\\$');
	});
});
