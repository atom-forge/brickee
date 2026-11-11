// The stored document: what the editor writes and an app saves. Built-in blocks are `md:<kind>` with inline markdown text
// (raw text for md:code); every other type belongs to a plugin, with its own props and, for containers, nested blocks.

export interface StoredBlock {
	type: string;
	indent: number;
	text?: string;
	props?: Record<string, unknown>;
	blocks?: StoredBlock[];
}

export const MD = 'md:';
export const MAX_INDENT = 6;
/** Plugins with nested blocks hold one level only, so a document is at most this deep. */
export const MAX_DEPTH = 2;

export const isMd = (b: StoredBlock) => b.type.startsWith(MD);

/** Inline markdown -> plain text: marks, escapes and link targets dropped. */
export function inlineToPlainText(md: string): string {
	return md
		.replace(/<\/?(u|sub|sup)>/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/(\*\*|~~|`)/g, '')
		.replace(/(?<![\\*])\*(?!\*)/g, '')
		.replace(/\\(.)/g, '$1');
}

/** Every text of a document, in order: for search, leads and meta descriptions. */
export function blocksToPlainText(blocks: StoredBlock[]): string {
	const out: string[] = [];
	const walk = (list: StoredBlock[]) => {
		for (const b of list) {
			if (b.text) out.push(b.type === 'md:code' ? b.text : inlineToPlainText(b.text));
			for (const v of Object.values(b.props ?? {})) {
				// Titles, captions and table cells are text too; ids, colours and switches are not.
				if (typeof v === 'string' && /\s/.test(v.trim())) out.push(v.trim());
				if (Array.isArray(v)) for (const row of v) if (Array.isArray(row)) out.push(row.map((c) => inlineToPlainText(String(c))).join(' '));
			}
			if (b.blocks) walk(b.blocks);
		}
	};
	walk(blocks);
	return out.filter(Boolean).join('\n\n');
}

/**
 * Does a container's `accepts` list take this palette id? The list holds palette ids, and 'md:*' for every built-in
 * block (text, headings, lists, quote, code, divider). No list: everything.
 */
export const acceptsId = (accepts: readonly string[] | undefined, id: string) =>
	!accepts || accepts.some((a) => a === id || (a === 'md:*' && id.startsWith('md:')));
