import { MAX_INDENT, MD, newBlock, numbering, type Block, type BlockPlugin, type BlockType, type StoredBlock } from './types';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Characters escaped in plain text so they never turn into inline markup. */
const SPECIAL = /[\\`*~[\]<]/g;
const MARK = '\u0000';

/** Inline markdown -> inline html (b, i, u, sub, sup, strike, code, a, br). Backslash escapes are honoured; links are
 * http(s), mailto, tel or site-relative only. */
export function inline(md: string): string {
	const kept: string[] = [];
	const guarded = md.replace(/\\([\\`*~[\]<>#+.!_-])/g, (_, c: string) => `${MARK}${kept.push(c) - 1}${MARK}`);
	const restore = (s: string, raw: boolean) =>
		s.replace(/\u0000(\d+)\u0000/g, (_, n: string) => (raw ? '\\' : '') + esc(kept[+n]));
	return guarded
		.split(/(`[^`]+`)/)
		.map((seg, i) => {
			if (i % 2) return `<code>${restore(esc(seg.slice(1, -1)), true)}</code>`;
			const html = esc(seg)
				.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
				.replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, '<i>$1</i>')
				.replace(/~~(.+?)~~/g, '<strike>$1</strike>')
				.replace(/&lt;(u|sub|sup)&gt;(.+?)&lt;\/\1&gt;/g, '<$1>$2</$1>')
				.replace(/\[(.+?)\]\(((?:https?:|mailto:|tel:|\/(?!\/))[^)\s]+)\)/g, '<a href="$2">$1</a>')
				.replace(/\n/g, '<br>');
			return restore(html, false);
		})
		.join('');
}

function walk(n: Node, code: boolean): string {
	if (n.nodeType === Node.TEXT_NODE) {
		// Zero-width spaces only hold the caret outside a mark (see plainText()).
		const t = (n.textContent ?? '').replace(/\u200B/g, '');
		return code ? t : t.replace(SPECIAL, '\\$&');
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
			return inner && !code ? `\`${inner}\`` : inner;
		case 'A':
			return `[${inner}](${n.getAttribute('href') ?? ''})`;
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

/** Line starts that markdown would read as a block; a paragraph starting like this gets a leading backslash. */
const BLOCK_START = /^(?:#{1,6} |[-*+] |\d{1,3}[.)] |>|```|([-*_])\1{2,}\s*$)/;
const RULE = /^([-*_])\1{2,}\s*$/;
/** Opening code fence with an optional language: ```ts, ```c++, ```objective-c… */
const FENCE = /^```([\w+#.-]*)[^\S\n]*/;
const LINE = /^(?:(#{1,6}) |[-*+] \[([ xX])\] |([-*+]) |(\d{1,3})[.)] |(>) ?)?([\s\S]*)$/;

/** One block -> its markdown snippet, without indentation. `n` is the ordinal of a numbered item. */
export function blockToMd(b: Block, n = 1): string {
	if (b.type === 'plugin') return '';
	if (b.type === 'hr') return '---';
	if (b.type === 'code') return '```' + ((b.props?.lang as string) ?? '') + '\n' + htmlToMarkdown(b.html, true) + '\n```';
	const t = htmlToMarkdown(b.html);
	switch (b.type) {
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5':
		case 'h6':
			return `${'#'.repeat(+b.type[1])} ${t}`;
		case 'ul':
			return `- ${t}`;
		case 'ol':
			return `${n}. ${t}`;
		case 'todo':
			return `- [${b.checked ? 'x' : ' '}] ${t}`;
		case 'quote':
			return `> ${t}`;
		default:
			return BLOCK_START.test(t) ? '\\' + t : t;
	}
}

/** One markdown snippet -> block fields. */
export function mdToBlock(md: string): Pick<Block, 'type' | 'html' | 'checked' | 'props'> {
	const fence = FENCE.exec(md);
	if (fence) {
		const body = md.slice(fence[0].length).replace(/^\n/, '').replace(/\n?```\s*$/, '');
		return { type: 'code', html: codeHtml(body), ...(fence[1] ? { props: { lang: fence[1] } } : {}) };
	}
	if (RULE.test(md)) return { type: 'hr', html: '' };
	const m = LINE.exec(md)!;
	const type: BlockType = m[1]
		? (`h${m[1].length}` as BlockType)
		: m[2]
			? 'todo'
			: m[3]
				? 'ul'
				: m[4]
					? 'ol'
					: m[5]
						? 'quote'
						: 'p';
	let text = m[6];
	// Undo the backslash blockToMd put before a block-like start (text escapes such as `\*` stay).
	if (type === 'p' && text[0] === '\\' && !/[\\`*~[\]<]/.test(text[1] ?? '\\') && BLOCK_START.test(text.slice(1)))
		text = text.slice(1);
	return { type, html: inline(text), ...(type === 'todo' ? { checked: m[2].toLowerCase() === 'x' } : {}) };
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
		...(kind === 'code' && s.props?.lang ? { props: { lang: s.props.lang } } : {})
	});
}

/** Markdown text -> blocks. Supports headings, lists, todos, quotes, fenced code, hr and basic inline marks. */
export function fromMarkdown(src: string): Block[] {
	const out: Block[] = [];
	const lines = src.replace(/\r/g, '').split('\n');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const fence = FENCE.exec(line.trimStart());
		if (fence) {
			const code: string[] = [];
			i++;
			while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
			out.push(newBlock('code', codeHtml(code.join('\n')), fence[1] ? { props: { lang: fence[1] } } : {}));
			continue;
		}
		if (!line.trim()) continue;
		const lead = /^\s*/.exec(line)![0];
		const indent = Math.min(MAX_INDENT, Math.floor(lead.replace(/\t/g, '  ').length / 2));
		const { type, html, ...extra } = mdToBlock(line.slice(lead.length));
		out.push(newBlock(type, html, { indent, ...extra }));
	}
	return out;
}

/** Blocks -> markdown text (browser only: uses the DOM to read the inline html). A plugin block is written by its
 * plugin's `markdown`; one without it is left out. */
export function toMarkdown(blocks: Block[], opts: { plugins?: BlockPlugin[] } = {}): string {
	const nums = numbering(blocks);
	const listy = (t: BlockType) => t === 'ul' || t === 'ol' || t === 'todo';
	const md = (b: Block) => {
		if (b.type !== 'plugin') return ('  ').repeat(listy(b.type) || b.type === 'p' ? b.indent : 0) + blockToMd(b, nums[b.id]);
		const plugin = opts.plugins?.find((p) => p.type === b.plugin);
		if (!plugin?.markdown) return '';
		const inner = b.blocks?.length ? toMarkdown(b.blocks.map(fromStored), opts) : '';
		return plugin.markdown(b.props ?? {}, { inner }).trim();
	};
	let out = '';
	let prev: Block | undefined;
	for (const b of blocks) {
		const text = md(b);
		if (!text) continue;
		if (prev) out += listy(b.type) && listy(prev.type) ? '\n' : '\n\n';
		out += text;
		prev = b;
	}
	return out;
}
