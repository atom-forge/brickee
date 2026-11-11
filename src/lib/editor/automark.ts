// Inline markdown while typing: `**bold**`, `*italic*` / `_italic_`, `~~strike~~` turn into their mark when a space,
// a punctuation mark or Enter follows the closing marker; `` `code` `` on its closing backtick, `[text](url)` on its
// closing parenthesis. The same rules as reading markdown, stricter: a `*` or `_` opens only at a word's edge (2*3*4
// and snake_case stay text), and a backslash before the opening marker keeps it text.

export type Mark = 'b' | 'i' | 'strike' | 'code' | 'a';

export interface MarkMatch {
	/** Where the marked source (markers included) starts and ends in the text. */
	start: number;
	end: number;
	tag: Mark;
	/** The text inside the marks. */
	text: string;
	/** A link's address. */
	href?: string;
}

/** Characters after a closing marker that make it a mark. */
const BOUNDARY = /[\s.,;:!?)\]}'"»”’…]/;
const W = String.raw`\p{L}\p{N}`;
/** Each pattern ends at the end of the text; group 1 is the marked source, group 2 the text inside. */
const DELIMITED: [Mark, RegExp][] = [
	['b', new RegExp(String.raw`(?:^|[^\\*${W}])(\*\*(?![\s*])([^*\n]{1,2000}?)(?<![\s*])\*\*)$`, 'u')],
	['b', new RegExp(String.raw`(?:^|[^\\_${W}])(__(?![\s_])([^_\n]{1,2000}?)(?<![\s_])__)$`, 'u')],
	['strike', new RegExp(String.raw`(?:^|[^\\~])(~~(?![\s~])([^~\n]{1,2000}?)(?<![\s~])~~)$`, 'u')],
	['i', new RegExp(String.raw`(?:^|[^\\*${W}])(\*(?![\s*])([^*\n]{1,2000}?)(?<![\s*])\*)$`, 'u')],
	['i', new RegExp(String.raw`(?:^|[^\\_${W}])(_(?![\s_])([^_\n]{1,2000}?)(?<![\s_])_)$`, 'u')]
];
const CODE = /(?:^|[^\\`])(`([^`\n]{1,2000})`)$/;
const LINK = /(?:^|[^\\!])(\[([^[\]\n]{1,500})\]\(([^()\s]{1,2000})\))$/;
const SAFE = /^(?:https?:|mailto:|tel:|\/(?!\/))/i;

const found = (text: string, m: RegExpExecArray, tag: Mark, href?: string): MarkMatch => ({
	start: m.index + m[0].length - m[1].length,
	end: text.length,
	tag,
	text: m[2],
	...(href ? { href } : {})
});

/**
 * A mark the typed text ends in, or null. `text` is what stands before the caret in one text node, the character just
 * typed last; with `closing`, the text is complete as it is (Enter was pressed after it).
 */
export function matchMark(text: string, closing = false): MarkMatch | null {
	// Only the end matters: a long paragraph costs no more than its last part.
	const cut = Math.max(0, text.length - 2600);
	const tail = text.slice(cut);
	const at = (m: MarkMatch | null) => (m ? { ...m, start: m.start + cut, end: m.end + cut } : null);
	const last = tail.at(-1) ?? '';
	if (!closing && last === '`') {
		const m = CODE.exec(tail);
		return m && m[2].trim() ? at(found(tail, m, 'code')) : null;
	}
	if (!closing && last === ')') {
		const m = LINK.exec(tail);
		if (!m) return null;
		const url = m[3];
		const href = SAFE.test(url) ? url : /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(url) ? `https://${url}` : null;
		return href ? at(found(tail, m, 'a', href)) : null;
	}
	if (!closing && !BOUNDARY.test(last)) return null;
	const body = closing ? tail : tail.slice(0, -1);
	for (const [tag, re] of DELIMITED) {
		const m = re.exec(body);
		if (m) return at(found(body, m, tag));
	}
	return null;
}
