// Formatted paste: HTML from a web page, Google Docs, Word… -> markdown -> blocks. Going through markdown reuses
// everything fromMarkdown does (list nesting, tables for a plugin that takes them, safe links); the HTML is only read,
// never inserted. Browser only (DOMParser).
import { codeSpan, escLine, escText, fromMarkdown, mdUrl } from './markdown';
import type { Block, BlockPlugin } from './types';

/** Never read: no text of theirs belongs in a document. */
const SKIP = new Set(['SCRIPT', 'STYLE', 'HEAD', 'TITLE', 'META', 'LINK', 'TEMPLATE', 'NOSCRIPT', 'SVG', 'CANVAS', 'IFRAME', 'OBJECT', 'EMBED', 'BUTTON', 'SELECT', 'TEXTAREA', 'INPUT', 'VIDEO', 'AUDIO']);
/** Elements that make blocks; everything else is inline. */
const BLOCK = new Set([
	'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BODY', 'CENTER', 'DD', 'DETAILS', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM',
	'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HR', 'HTML', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION', 'SUMMARY', 'TABLE', 'UL'
]);

const BLOCK_SELECTOR = [...BLOCK].map((t) => t.toLowerCase()).join(',');
/** A block, or an inline element that holds blocks (Google Docs wraps a whole copy in a <b>): a container then. */
const isBlock = (n: Node) => n instanceof HTMLElement && (BLOCK.has(n.tagName) || (!SKIP.has(n.tagName) && !!n.querySelector(BLOCK_SELECTOR)));

/** Marks around text, with its spaces kept outside (`** bold**` is no mark). */
function wrap(inner: string, open: string, close = open) {
	const [, a, core, b] = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner)!;
	return core ? a + open + core + close + b : inner;
}

/** The marks a span's inline style stands for (Google Docs writes bold and italic as styles). */
function styled(el: HTMLElement, inner: string) {
	const s = el.style;
	const weight = s.fontWeight;
	let out = inner;
	if (weight === 'bold' || weight === 'bolder' || Number(weight) >= 600) out = wrap(out, '**');
	if (s.fontStyle === 'italic') out = wrap(out, '*');
	if (s.textDecoration.includes('line-through') || s.textDecorationLine.includes('line-through')) out = wrap(out, '~~');
	if (s.textDecoration.includes('underline') || s.textDecorationLine.includes('underline')) out = wrap(out, '<u>', '</u>');
	if (s.verticalAlign === 'super') out = wrap(out, '<sup>', '</sup>');
	if (s.verticalAlign === 'sub') out = wrap(out, '<sub>', '</sub>');
	return out;
}

/** Inline content as inline markdown; `\n` where the HTML breaks a line. */
function inline(nodes: Iterable<Node>): string {
	let text = '';
	// HTML collapses neighbouring spaces, also across marks ("a <b> b</b>").
	const out = {
		add(s: string) {
			text += /[ \n]$/.test(text) || !text ? s.replace(/^ +/, '') : s;
		}
	};
	for (const n of nodes) {
		if (n.nodeType === Node.TEXT_NODE) {
			out.add(escText((n.textContent ?? '').replace(/[ \t\r\n]+/g, ' ')));
			continue;
		}
		if (!(n instanceof HTMLElement) || SKIP.has(n.tagName)) continue;
		const tag = n.tagName;
		if (tag === 'BR') {
			out.add('\n');
			continue;
		}
		if (tag === 'IMG') {
			// No images in the package: a picture becomes a link to it.
			const src = n.getAttribute('src') ?? '';
			if (/^https?:/i.test(src)) out.add(`[${escText(n.getAttribute('alt') || src)}](${mdUrl(src)})`);
			continue;
		}
		if (tag === 'CODE' || tag === 'KBD' || tag === 'SAMP' || tag === 'TT') {
			const text = (n.textContent ?? '').replace(/\s+/g, ' ');
			out.add(text.trim() ? codeSpan(text) : text);
			continue;
		}
		// A block inside inline content (a paragraph in a list item): its own line.
		const inner = isBlock(n) ? `\n${inline(n.childNodes).trim()}\n` : inline(n.childNodes);
		if (tag === 'A') {
			const href = n.getAttribute('href') ?? '';
			out.add(inner.trim() && href && !href.startsWith('#') ? wrap(inner, '[', `](${mdUrl(href)})`) : inner);
		} else if (tag === 'B' || tag === 'STRONG') {
			// Google Docs wraps a whole copy in <b style="font-weight:normal">.
			const w = n.style.fontWeight;
			out.add(w === 'normal' || w === '400' ? styled(n, inner) : wrap(inner, '**'));
		} else if (tag === 'I' || tag === 'EM' || tag === 'CITE' || tag === 'DFN' || tag === 'VAR') out.add(wrap(inner, '*'));
		else if (tag === 'U' || tag === 'INS') out.add(wrap(inner, '<u>', '</u>'));
		else if (tag === 'S' || tag === 'DEL' || tag === 'STRIKE') out.add(wrap(inner, '~~'));
		else if (tag === 'SUB' || tag === 'SUP') out.add(wrap(inner, `<${tag.toLowerCase()}>`, `</${tag.toLowerCase()}>`));
		else out.add(styled(n, inner));
	}
	return text;
}

/** Inline markdown as the lines of a paragraph: each line escaped where it would read as a block start. */
const lines = (md: string) =>
	md
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)
		.map(escLine);

/** A container's children as markdown chunks (blocks); runs of inline content become paragraphs. */
function chunks(el: Element): string[] {
	const out: string[] = [];
	let run: Node[] = [];
	const flush = () => {
		const ls = lines(inline(run));
		if (ls.length) out.push(ls.join('\n'));
		run = [];
	};
	for (const n of el.childNodes) {
		if (n instanceof HTMLElement && SKIP.has(n.tagName)) continue;
		if (isBlock(n)) {
			flush();
			out.push(...block(n as HTMLElement));
		} else run.push(n);
	}
	flush();
	return out;
}

function block(el: HTMLElement): string[] {
	const tag = el.tagName;
	if (/^H[1-6]$/.test(tag)) {
		const text = inline(el.childNodes).replace(/\s*\n\s*/g, ' ').trim();
		return text ? [`${'#'.repeat(+tag[1])} ${text}`] : [];
	}
	if (tag === 'HR') return ['---'];
	if (tag === 'UL' || tag === 'OL') {
		const md = list(el, 0);
		return md ? [md] : [];
	}
	if (tag === 'PRE') {
		const text = (el.textContent ?? '').replace(/\r/g, '').replace(/\n$/, '');
		const lang = /(?:^|\s)(?:language|lang)-([\w+#.-]+)/.exec(`${el.className} ${el.querySelector('code')?.className ?? ''}`)?.[1] ?? '';
		const fence = '`'.repeat(Math.max(3, ...(text.match(/`+/g) ?? []).map((r) => r.length + 1)));
		return [`${fence}${lang}\n${text}\n${fence}`];
	}
	if (tag === 'BLOCKQUOTE') {
		const inner = chunks(el);
		return inner.length ? [inner.map((c) => c.split('\n').map((l) => `> ${l}`).join('\n')).join('\n>\n')] : [];
	}
	if (tag === 'TABLE') return table(el);
	return chunks(el);
}

/** A list and its nested lists, `indent` spaces in. */
function list(el: HTMLElement, indent: number): string {
	const pad = ' '.repeat(indent);
	const ordered = el.tagName === 'OL';
	let n = Number(el.getAttribute('start')) || 1;
	const out: string[] = [];
	for (const li of el.children) {
		if (li.tagName !== 'LI') continue;
		const box = li.querySelector(':scope > input[type="checkbox"], :scope > p > input[type="checkbox"], :scope > label > input[type="checkbox"]') as HTMLInputElement | null;
		const marker = ordered ? `${n++}. ` : box ? `- [${box.checked || box.hasAttribute('checked') ? 'x' : ' '}] ` : '- ';
		const own = [...li.childNodes].filter((c) => !(c instanceof HTMLElement && (c.tagName === 'UL' || c.tagName === 'OL')));
		const [first = '', ...more] = lines(inline(own));
		out.push(pad + marker + first);
		const inner = ' '.repeat(indent + marker.length);
		for (const l of more) out.push(inner + l);
		for (const sub of li.children) if (sub.tagName === 'UL' || sub.tagName === 'OL') {
			const md = list(sub as HTMLElement, indent + marker.length);
			if (md) out.push(md);
		}
	}
	return out.join('\n');
}

/** A table as a GFM table: the first row is the header; the alignment from the header cells. */
function table(el: HTMLElement): string[] {
	const rows = [...el.querySelectorAll('tr')].filter((tr) => tr.closest('table') === el);
	const grid = rows.map((tr) =>
		[...tr.children]
			.filter((c) => c.tagName === 'TD' || c.tagName === 'TH')
			.map((c) => inline(c.childNodes).replace(/\s*\n\s*/g, '<br>').trim().replace(/\|/g, '\\|'))
	);
	if (!grid.length || !grid[0].length) return [];
	const width = Math.max(...grid.map((r) => r.length));
	const align = [...rows[0].children].map((c) => {
		const a = ((c as HTMLElement).style.textAlign || c.getAttribute('align') || '').toLowerCase();
		return a === 'center' ? ':-:' : a === 'right' ? '--:' : '---';
	});
	const row = (r: string[]) => `| ${[...r, ...Array(width - r.length).fill('')].join(' | ')} |`;
	return [[row(grid[0]), row(Array.from({ length: width }, (_, i) => align[i] ?? '---')), ...grid.slice(1).map(row)].join('\n')];
}

/** HTML (a pasted fragment or a page) as markdown. Browser only. */
export function markdownFromHtml(html: string): string {
	const doc = new DOMParser().parseFromString(html, 'text/html');
	return chunks(doc.body).join('\n\n');
}

/**
 * HTML -> blocks, the way the editor takes a formatted paste: headings, paragraphs, lists (nested, numbered with their
 * start, to-dos from checkboxes), quotes, code (`pre`, with a `language-…` class), rules, and inline marks — also
 * Google Docs' styled spans. A table goes to the first of `plugins` that takes tables (`fromTable`). Images become
 * links; scripts, styles and form controls are dropped. Browser only.
 */
export function fromHtml(html: string, opts: { plugins?: BlockPlugin[] } = {}): Block[] {
	return fromMarkdown(markdownFromHtml(html), opts);
}
