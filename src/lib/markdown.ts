import {
	MAX_INDENT,
	MD,
	newBlock,
	numbering,
	olStart,
	type Block,
	type BlockPlugin,
	type BlockType,
	type MarkdownTable,
	type StoredBlock
} from './types';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Characters escaped in plain text so they never turn into inline markup (`_` only at a word's edge, see walk()). */
const SPECIAL = /[\\`*~[\]<]/g;
/** A backslash escape: any ASCII punctuation (CommonMark). */
const ESCAPE = /\\([!-/:-@[-`{-~])/g;
const MARK = '\u0000';
const STASH = '\u0001';
/** Link targets kept as links: http(s), mailto, tel and site-relative paths; anything else stays text. */
const SAFE_URL = /^(?:https?:|mailto:|tel:|\/(?!\/))/i;
/** A link target: no spaces, parentheses only balanced (`…/Foo_(bar)`), then an optional title that is dropped. */
const DEST = String.raw`((?:[^()\s]|\([^()\s]{0,200}\)){1,2000})(?:\s+(?:"[^"]{0,500}"|'[^']{0,500}'|\([^()]{0,500}\)))?`;
/** A link or an image: the label has no brackets of its own and is bounded, so a run of `[` stays linear. */
const LINK = new RegExp(String.raw`(!?)\[([^\[\]]{0,1000})\]\(\s*${DEST}\s*\)`, 'g');
/** Word characters, for the edges of `_` emphasis (no intraword `_`, as in `snake_case`). */
const W = String.raw`\p{L}\p{N}_`;
/** The marks; a marked span is at most 2000 characters, so an unclosed `**` costs a bounded scan. */
const EMPHASIS: [RegExp, string][] = [
	[/\*\*\*(?!\s)(.{1,2000}?)(?<!\s)\*\*\*/g, '<b><i>$1</i></b>'],
	[new RegExp(String.raw`(?<![${W}])___(?!\s)(.{1,2000}?)(?<!\s)___(?![${W}])`, 'gu'), '<b><i>$1</i></b>'],
	[/\*\*(?!\s)(.{1,2000}?)(?<!\s)\*\*/g, '<b>$1</b>'],
	[new RegExp(String.raw`(?<![${W}])__(?!\s)(.{1,2000}?)(?<!\s)__(?![${W}])`, 'gu'), '<b>$1</b>'],
	[/(?<!\*)\*(?![\s*])(.{1,2000}?)(?<![\s*])\*(?!\*)/g, '<i>$1</i>'],
	[new RegExp(String.raw`(?<![${W}])_(?![\s_])(.{1,2000}?)(?<![\s_])_(?![${W}])`, 'gu'), '<i>$1</i>'],
	[/~~(?!\s)(.{1,2000}?)(?<!\s)~~/g, '<strike>$1</strike>']
];
/** Inline HTML that maps onto the marks; any other tag is dropped (its text stays). */
const HTML_MARKS: Record<string, string> = { b: 'b', strong: 'b', i: 'i', em: 'i', s: 'strike', del: 'strike', strike: 'strike', u: 'u', sub: 'sub', sup: 'sup', code: 'code' };
/**
 * One HTML tag in escaped text (opening, closing or self-closing), never a pair: its name and its attributes are
 * bounded and cannot run past a `<` or `>`, so a failed match costs a bounded amount and the whole scan stays linear.
 */
const TAG = /&lt;(\/?)([a-z][\w-]{0,30})(?:\s(?:[^&]|&(?!lt;|gt;)){0,500})?&gt;/gi;

/**
 * The replacer for TAG: pairs the marks with a stack, so the output is always balanced — a closing tag closes the
 * marks opened inside it too, a stray closing tag is dropped, and the marks still open at the end are closed.
 */
function htmlTag(stash: (tag: string) => string) {
	const open: string[] = [];
	const replace = (_: string, closing: string, name: string) => {
		const tag = name.toLowerCase();
		if (tag === 'br') return stash('<br>');
		const mark = HTML_MARKS[tag];
		if (!mark) return '';
		if (!closing) {
			open.push(mark);
			return stash(`<${mark}>`);
		}
		const at = open.lastIndexOf(mark);
		return at < 0 ? '' : open.splice(at).reverse().map((m) => stash(`</${m}>`)).join('');
	};
	/** The closing tags of the marks left open. */
	replace.rest = () => open.splice(0).reverse().map((m) => stash(`</${m}>`)).join('');
	return replace;
}

/** Code spans: a run of backticks up to the next run of the same length (`` a`b ``); an unmatched run is text. */
function codeSpans(s: string): { code: boolean; text: string }[] {
	const out: { code: boolean; text: string }[] = [];
	const runs = /`+/g;
	let last = 0;
	for (let m = runs.exec(s); m; m = runs.exec(s)) {
		const close = new RegExp(`(?<!\`)${m[0]}(?!\`)`, 'g');
		close.lastIndex = m.index + m[0].length;
		const c = close.exec(s);
		if (!c) continue;
		let body = s.slice(m.index + m[0].length, c.index).replace(/\n/g, ' ');
		if (body.length > 2 && body[0] === ' ' && body.at(-1) === ' ' && body.trim()) body = body.slice(1, -1);
		out.push({ code: false, text: s.slice(last, m.index) }, { code: true, text: body });
		last = runs.lastIndex = c.index + m[0].length;
	}
	out.push({ code: false, text: s.slice(last) });
	return out;
}

/** Inline markdown -> inline html (b, i, u, sub, sup, strike, code, a, br). Backslash escapes are honoured; links are
 * http(s), mailto, tel or site-relative only. Images become links (the package has no notion of images), footnote
 * references superscripts, and inline HTML its marks (other tags are dropped). */
export function inline(md: string): string {
	const kept: string[] = [];
	const guarded = md.replace(ESCAPE, (_, c: string) => `${MARK}${kept.push(c) - 1}${MARK}`);
	const restore = (s: string, raw: boolean) =>
		s.replace(/\u0000(\d+)\u0000/g, (_, n: string) => (raw ? '\\' : '') + esc(kept[+n]));
	// Generated tags (code spans, links…) are stashed while the rest runs, so a `_` or `*` in a link target or in code
	// stays as it is, and emphasis can wrap a code span (**`x`**).
	const tags: string[] = [];
	const stash = (tag: string) => `${STASH}${tags.push(tag) - 1}${STASH}`;
	const link = (url: string, text: string) => {
		const href = url.replace(/&amp;/g, '&');
		return SAFE_URL.test(href) ? stash(`<a href="${esc(href).replace(/"/g, '&quot;')}">`) + (text || esc(href)) + stash('</a>') : null;
	};
	const htmlTags = htmlTag(stash);
	let html = codeSpans(guarded)
		.map(({ code, text }) => (code ? stash(`<code>${restore(esc(text), true)}</code>`) : esc(text)))
		.join('')
		.replace(LINK, (all, bang: string, label: string, url: string) => link(url, bang && !label ? '' : label) ?? all)
		.replace(/&lt;((?:https?:\/\/|mailto:)(?:[^\s&]|&amp;){1,2000})&gt;/gi, (all, url: string) => link(url, '') ?? all)
		.replace(/&lt;([^\s@&]{1,200}@[^\s@&]{1,200}\.[^\s&]{1,200})&gt;/g, (all, mail: string) => link(`mailto:${mail}`, mail) ?? all)
		.replace(/\[\^([^\]\s]{1,100})\]/g, (_, id: string) => stash('<sup>') + id + stash('</sup>'))
		.replace(TAG, htmlTags);
	html += htmlTags.rest();
	for (const [re, to] of EMPHASIS) html = html.replace(re, to);
	html = html.replace(/\n/g, '<br>').replace(/\u0001(\d+)\u0001/g, (_, n: string) => tags[+n]);
	return restore(html, false);
}

/** A link target as markdown reads it back: spaces and unbalanced parentheses encoded. */
export function mdUrl(href: string): string {
	let depth = 0;
	const balanced = [...href].every((c) => (c === '(' ? ++depth : c === ')' ? --depth : depth) >= 0) && depth === 0;
	return (balanced ? href : href.replace(/\(/g, '%28').replace(/\)/g, '%29')).replace(/\s/g, '%20');
}

/** Plain text as inline markdown: what would read as a mark is escaped (`_` only at a word's edge: snake_case stays). */
export function escText(t: string): string {
	return t
		.replace(SPECIAL, '\\$&')
		.replace(/_/g, (u, i: number, s: string) => (/[\p{L}\p{N}]/u.test(s[i - 1] ?? '') && /[\p{L}\p{N}]/u.test(s[i + 1] ?? '') ? u : '\\_'));
}

/** Inline markdown for a code span: a fence longer than any backtick run inside, padded when it starts or ends with one. */
export function codeSpan(text: string): string {
	const fence = '`'.repeat(Math.max(0, ...(text.match(/`+/g) ?? []).map((r) => r.length)) + 1);
	const pad = /^`|`$/.test(text) ? ' ' : '';
	return fence + pad + text + pad + fence;
}

function walk(n: Node, code: boolean): string {
	if (n.nodeType === Node.TEXT_NODE) {
		// Zero-width spaces only hold the caret outside a mark (see plainText()).
		const t = (n.textContent ?? '').replace(/​/g, '');
		return code ? t : escText(t);
	}
	if (!(n instanceof HTMLElement)) return '';
	const inCode = code || n.tagName === 'CODE';
	const inner = [...n.childNodes].map((c) => walk(c, inCode)).join('');
	switch (n.tagName) {
		case 'B':
		case 'STRONG':
			return inner ? `**${inner}**` : '';
		case 'I':
		case 'EM':
			return inner ? `*${inner}*` : '';
		case 'U':
		case 'SUB':
		case 'SUP': {
			const tag = n.tagName.toLowerCase();
			return inner ? `<${tag}>${inner}</${tag}>` : '';
		}
		case 'S':
		case 'STRIKE':
		case 'DEL':
			return inner ? `~~${inner}~~` : '';
		case 'CODE':
			return !inner || code ? inner : codeSpan(inner);
		case 'A':
			return `[${inner}](${mdUrl(n.getAttribute('href') ?? '')})`;
		case 'BR':
			return '\n';
		default:
			return inner;
	}
}

/** Inline html -> inline markdown (browser only). `code` keeps the text verbatim, as in a code block. */
export function htmlToMarkdown(html: string, code = false): string {
	const d = document.createElement('div');
	d.innerHTML = html;
	return walk(d, code);
}

/** Line starts that markdown would read as a block (or a setext underline); such a line of text gets escaped. */
const BLOCK_START = /^(?:#{1,6}(?:\s|$)|[-*+](?:\s|$)|\d{1,9}[.)](?:\s|$)|>|`{3}|~{3}|([-*_])(?:\s*\1){2,}\s*$|=+\s*$)/;
/** A thematic break: three or more -, * or _ (spaces between them allowed). */
const RULE = /^([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
/** An opening code fence: three or more backticks or tildes, then an optional language. */
const FENCE = /^(`{3,}|~{3,})[ \t]*([^\s`]*)[^`\n]*$/;
/** An ATX heading (`## Title`, closing `#`s dropped), or null. Done by hand: a regex with a lazy text and an optional
 * closing sequence is quadratic on long runs of spaces. */
function heading(line: string): { level: number; text: string } | null {
	const m = /^#{1,6}(?=[ \t]|$)/.exec(line);
	if (!m) return null;
	let text = line.slice(m[0].length).trim();
	let k = text.length;
	while (k > 0 && text[k - 1] === '#') k--;
	if (k < text.length && (k === 0 || text[k - 1] === ' ' || text[k - 1] === '\t')) text = text.slice(0, k).trimEnd();
	return { level: m[0].length, text };
}
const ITEM = /^(?:([-*+])[ \t]+\[([ xX])\](?:[ \t]+|$)|([-*+])(?:[ \t]+|$)|(\d{1,9})([.)])(?:[ \t]+|$))/;
const SETEXT = /^(=+|-+)[ \t]*$/;
const TABLE_RULE = /^\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;

/** A line of text, escaped where markdown would read it as a block start (`1. ` as `1\. `). */
export function escLine(t: string): string {
	if (!BLOCK_START.test(t)) return t;
	const ol = /^(\d{1,9})([.)])/.exec(t);
	return ol ? `${ol[1]}\\${t.slice(ol[1].length)}` : '\\' + t;
}

/** One block -> its markdown snippet, without indentation. `n` is the ordinal of a numbered item. */
export function blockToMd(b: Block, n = 1): string {
	if (b.type === 'plugin') return '';
	if (b.type === 'hr') return '---';
	if (b.type === 'code') {
		const text = htmlToMarkdown(b.html, true);
		const fence = '`'.repeat(Math.max(3, ...(text.match(/`+/g) ?? []).map((r) => r.length + 1)));
		return fence + ((b.props?.lang as string) ?? '') + '\n' + text + '\n' + fence;
	}
	const lines = htmlToMarkdown(b.html).split('\n').map(escLine);
	switch (b.type) {
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5':
		case 'h6':
			return `${'#'.repeat(+b.type[1])} ${lines.join(' ')}`;
		case 'ul':
			return `- ${lines.join('\\\n  ')}`;
		case 'ol':
			return `${n}. ${lines.join('\\\n' + ' '.repeat(String(n).length + 2))}`;
		case 'todo':
			return `- [${b.checked ? 'x' : ' '}] ${lines.join('\\\n  ')}`;
		case 'quote':
			return lines.map((l) => `${'> '.repeat(b.indent + 1)}${l}`).join('\\\n');
		default:
			return lines.join('\\\n');
	}
}

/** One markdown line -> block fields (a heading, a list item, a quote, a rule or a paragraph). */
export function mdToBlock(md: string): Pick<Block, 'type' | 'html' | 'checked' | 'props'> {
	if (RULE.test(md)) return { type: 'hr', html: '' };
	const h = heading(md);
	if (h) return { type: `h${h.level}` as BlockType, html: inline(h.text) };
	const q = /^>[ \t]?/.exec(md);
	if (q) return { type: 'quote', html: inline(md.slice(q[0].length)) };
	const m = ITEM.exec(md);
	if (m) {
		const text = md.slice(m[0].length);
		if (m[2]) return { type: 'todo', html: inline(text), checked: m[2] !== ' ' };
		if (m[3]) return { type: 'ul', html: inline(text) };
		return { type: 'ol', html: inline(text), props: { start: +m[4] } };
	}
	// Undo a backslash an older export put before a block-like start ("\1. "); text escapes such as `\*` stay.
	const text = md[0] === '\\' && /[^!-/:-@[-`{-~]/.test(md[1] ?? '\\') && BLOCK_START.test(md.slice(1)) ? md.slice(1) : md;
	return { type: 'p', html: inline(text) };
}

const BUILT_IN: BlockType[] = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'todo', 'quote', 'code', 'hr'];
const codeHtml = (text: string) => esc(text).replace(/\n/g, '<br>');

/** Inline html -> the same letters without formatting (line breaks kept), as a code block holds them. */
export function plainHtml(html: string): string {
	const d = document.createElement('div');
	d.innerHTML = html.replace(/<br\s*\/?>/gi, '\n');
	return codeHtml(d.textContent ?? '');
}

/** Editor block -> stored block: `md:<kind>` with inline markdown text, or the plugin's own type. */
export function toStored(b: Block): StoredBlock {
	if (b.type === 'plugin')
		return { type: b.plugin!, indent: b.indent, props: b.props ?? {}, ...(b.blocks ? { blocks: b.blocks } : {}) };
	const out: StoredBlock = { type: MD + b.type, indent: b.indent };
	if (b.type === 'code') out.text = htmlToMarkdown(b.html, true);
	else if (b.type !== 'hr') out.text = htmlToMarkdown(b.html);
	if (b.type === 'todo') out.props = { checked: !!b.checked };
	if (b.type === 'code' && b.props?.lang) out.props = { lang: b.props.lang };
	if (b.type === 'ol' && b.props?.start != null && olStart(b.props) !== 1) out.props = { start: olStart(b.props) };
	return out;
}

/** Stored block -> editor block with a fresh id. Unknown types (md: or plugin) are kept as they are. */
export function fromStored(s: StoredBlock): Block {
	const kind = s.type.slice(MD.length) as BlockType;
	if (!s.type.startsWith(MD) || !BUILT_IN.includes(kind))
		return newBlock('plugin', '', { plugin: s.type, indent: s.indent, props: s.props ?? {}, blocks: s.blocks });
	const text = s.text ?? '';
	const html = kind === 'code' ? codeHtml(text) : kind === 'hr' ? '' : inline(text);
	return newBlock(kind, html, {
		indent: s.indent,
		...(kind === 'todo' ? { checked: !!s.props?.checked } : {}),
		...(kind === 'code' && s.props?.lang ? { props: { lang: s.props.lang } } : {}),
		...(kind === 'ol' && s.props?.start != null ? { props: { start: olStart(s.props) } } : {})
	});
}

/** The cells of a table row: split at unescaped pipes, the outer pipes dropped, `\|` unescaped. */
function cells(line: string): string[] {
	const t = line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '');
	return t.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

/** The width of a line's leading whitespace (a tab counts 4). */
const leadOf = (line: string) => /^[ \t]*/.exec(line)![0].replace(/\t/g, '    ').length;
/** A line without `n` columns of leading whitespace (as far as it has them). */
const dedent = (line: string, n: number) => line.replace(/\t/g, '    ').replace(new RegExp(`^ {0,${n}}`), '');
/** A line ending in a hard break (two spaces or a backslash) or not, without that ending. */
const hardEnd = (line: string) => {
	let k = line.length;
	while (k > 0 && line[k - 1] === '\\') k--;
	// An odd run of backslashes at the end: the last one is the break, the others escape each other.
	return ((line.length - k) % 2 ? line.slice(0, -1) : line).trimEnd();
};

/**
 * Markdown text -> blocks (CommonMark and GFM, as far as blocks can hold them): headings (also setext), lists with
 * their nesting and start number, to-dos, quotes (also nested), fenced and indented code, rules, and paragraphs whose
 * lines are kept as line breaks. Reference links are resolved, footnotes become superscripts. A GFM table goes to the
 * first of `plugins` that takes it (`fromTable`), or stays text.
 */
export function fromMarkdown(src: string, opts: { plugins?: BlockPlugin[] } = {}): Block[] {
	const all = src.replace(/\r\n?/g, '\n').split('\n');
	// Reference definitions ([id]: url) are taken out and used by the links; footnote definitions stay as text.
	const refs = new Map<string, string>();
	const lines = all.filter((l) => {
		const d = /^ {0,3}\[([^\]^][^\]]*)\]:[ \t]*<?([^\s>]+)>?(?:[ \t]+(?:"[^"]*"|'[^']*'|\([^)]*\)))?[ \t]*$/.exec(l);
		if (d) refs.set(d[1].trim().toLowerCase(), d[2]);
		return !d;
	});
	const resolve = (t: string) =>
		!refs.size
			? t
			: t
					.replace(/(?<!\\)\[([^[\]]{1,1000})\]\[([^[\]]{0,1000})\]/g, (all, text: string, id: string) => {
						const url = refs.get((id || text).trim().toLowerCase());
						return url ? `[${text}](${url})` : all;
					})
					.replace(/(?<![\\\]!])\[([^[\]^][^[\]]{0,1000})\](?![([:])/g, (all, text: string) => {
						const url = refs.get(text.trim().toLowerCase());
						return url ? `[${text}](${url})` : all;
					});
	const tableTaker = opts.plugins?.find((p) => p.fromTable);

	const out: Block[] = [];
	// The open list items, by the column of their marker: a line indented past an item's marker is inside it.
	const items: number[] = [];
	const depth = (lead: number) => {
		while (items.length && lead <= items[items.length - 1]) items.pop();
		return Math.min(MAX_INDENT, items.length);
	};
	// The block the next plain line continues (a paragraph, a list item, a quote), and the quote's depth.
	let open: Block | null = null;
	const push = (b: Block) => {
		out.push(b);
		return b;
	};

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		const lead = leadOf(raw);
		const line = raw.trim();
		if (!line) {
			open = null;
			continue;
		}

		// Fenced code: closed by a fence of the same character, at least as long.
		const fence = lead < 4 || items.length ? FENCE.exec(line) : null;
		if (fence) {
			const indent = depth(lead);
			const body: string[] = [];
			const close = new RegExp(`^${fence[1][0] === '`' ? '`' : '~'}{${fence[1].length},}[ \\t]*$`);
			for (i++; i < lines.length && !close.test(lines[i].trim()); i++) body.push(dedent(lines[i], lead));
			const lang = fence[2].replace(/[^\w+#.-]/g, '');
			push(newBlock('code', codeHtml(body.join('\n')), { indent, ...(lang ? { props: { lang } } : {}) }));
			open = null;
			continue;
		}

		// Indented code: four spaces, outside lists and paragraphs.
		if (lead >= 4 && !open && !items.length) {
			const body: string[] = [];
			for (; i < lines.length && (leadOf(lines[i]) >= 4 || !lines[i].trim()); i++) body.push(dedent(lines[i], 4));
			i--;
			while (body.length && !body[body.length - 1].trim()) body.pop();
			push(newBlock('code', codeHtml(body.join('\n'))));
			open = null;
			continue;
		}

		// Setext heading: a paragraph underlined with = or -.
		if (open?.type === 'p' && !open.indent && SETEXT.test(line) && lead < 4) {
			open.type = line[0] === '=' ? 'h1' : 'h2';
			open = null;
			continue;
		}

		// GFM table: a header row, then a delimiter row.
		if (tableTaker && line.includes('|') && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1].trim()) && lines[i + 1].includes('-')) {
			const head = cells(line);
			const align = cells(lines[i + 1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : 'left')) as MarkdownTable['align'];
			const rows = [head];
			for (i += 2; i < lines.length && lines[i].trim() && lines[i].includes('|'); i++) rows.push(cells(lines[i]));
			i--;
			const width = Math.max(...rows.map((r) => r.length));
			const square = rows.map((r) => [...r, ...Array(width - r.length).fill('')].slice(0, width).map(resolve));
			const props = tableTaker.fromTable!({ rows: square, align: [...align, ...Array(width).fill('left')].slice(0, width) });
			push(newBlock('plugin', '', { plugin: tableTaker.type, props, indent: depth(lead) }));
			open = null;
			continue;
		}

		// Quotes: one block per paragraph, nested quotes one step deeper; `>` alone ends a paragraph.
		const q = /^(?:>[ \t]?)+/.exec(line);
		if (q) {
			const level = Math.min(MAX_INDENT, (q[0].match(/>/g) ?? []).length - 1);
			const text = line.slice(q[0].length);
			if (!text.trim()) {
				open = null;
				continue;
			}
			if (open?.type === 'quote' && open.indent === level) {
				open.html += '<br>' + inline(resolve(hardEnd(text)));
				continue;
			}
			open = push(newBlock('quote', inline(resolve(hardEnd(text))), { indent: level }));
			continue;
		}

		const item = ITEM.exec(line);
		const block = item || RULE.test(line) || heading(line);
		// A plain line right after a paragraph, a list item or a quote continues it (with a line break).
		if (open && !block) {
			const more = inline(resolve(hardEnd(line)));
			if (more.trim()) open.html += '<br>' + more;
			continue;
		}

		const indent = depth(lead);
		const { type, html, ...extra } = mdToBlock(resolve(hardEnd(line)));
		if (item) items.push(lead);
		else if (!indent) items.length = 0;
		// A footnote definition ([^1]: …) reads as the note after its number.
		const note = type === 'p' ? /^\[\^([^\]\s]+)\]:\s*/.exec(line) : null;
		const b = newBlock(type, note ? `<sup>${esc(note[1])}</sup> ${inline(resolve(hardEnd(line.slice(note[0].length))))}` : html, {
			indent: type === 'p' || item ? indent : 0,
			...extra
		});
		if (type === 'p' && !b.html.replace(/<br>/g, '').trim()) continue;
		push(b);
		open = type === 'p' || item ? b : null;
	}

	// A numbered list keeps its start number on its first item only (and only when it is not 1); as numbering() counts.
	const counters: number[] = [];
	for (const b of out) {
		if (b.type !== 'ol') {
			counters.length = Math.min(counters.length, b.indent);
			continue;
		}
		const first = counters[b.indent] === undefined;
		counters.length = b.indent + 1;
		counters[b.indent] = 1;
		if (!first || olStart(b.props) === 1) delete b.props;
	}
	return out;
}

/** Blocks -> markdown text (browser only: uses the DOM to read the inline html). A plugin block is written by its
 * plugin's `markdown`; one without it is left out. */
export function toMarkdown(blocks: Block[], opts: { plugins?: BlockPlugin[] } = {}): string {
	const nums = numbering(blocks);
	const listy = (t: BlockType) => t === 'ul' || t === 'ol' || t === 'todo';
	// The content column of the last list item at each level: what a nested block is indented by.
	const cols: number[] = [];
	const md = (b: Block) => {
		if (b.type === 'plugin') {
			const plugin = opts.plugins?.find((p) => p.type === b.plugin);
			if (!plugin?.markdown) return '';
			const inner = b.blocks?.length ? toMarkdown(b.blocks.map(fromStored), opts) : '';
			return plugin.markdown(b.props ?? {}, { inner }).trim();
		}
		const text = blockToMd(b, nums[b.id]);
		if (!text.trim() || (b.type === 'quote' && !htmlToMarkdown(b.html).trim())) return '';
		// Inside a list (a nested item, a paragraph or code under an item): indented to the item's content.
		const nested = (listy(b.type) || b.type === 'p' || b.type === 'code') && b.indent > 0 && cols.length > 0;
		const pad = nested ? ' '.repeat(cols[Math.min(b.indent, cols.length) - 1]) : '';
		if (listy(b.type)) {
			cols.length = Math.min(cols.length, b.indent);
			cols[b.indent] = pad.length + (b.type === 'ol' ? String(nums[b.id]).length + 2 : 2);
		} else if (!nested) cols.length = 0;
		return text
			.split('\n')
			.map((l) => (l ? pad + l : l))
			.join('\n');
	};
	let out = '';
	let prev: Block | undefined;
	for (const b of blocks) {
		const text = md(b);
		if (!text) continue;
		if (prev) {
			if (listy(b.type) && listy(prev.type)) out += '\n';
			// Quotes in a row stay one quote, a `>` line between their paragraphs.
			else if (b.type === 'quote' && prev.type === 'quote') out += '\n' + '>'.repeat(Math.min(b.indent, prev.indent) + 1) + '\n';
			else out += '\n\n';
		}
		out += text;
		prev = b;
	}
	return out;
}
