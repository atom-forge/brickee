import type { Component } from 'svelte';
import type { StoredBlock } from './model';
import type { Icon } from './palette';

export type BlockType = 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'ul' | 'ol' | 'todo' | 'quote' | 'code' | 'hr' | 'plugin';

export type Props = Record<string, unknown>;

export interface Block {
	/** Editor-only identity (rendering, focus, selection, drag); never stored. */
	id: string;
	type: BlockType;
	/** Inline HTML (b, i, u, strike, code, a, br). Always sanitized by construction, never raw paste. */
	html: string;
	indent: number;
	checked?: boolean;
	/** Properties edited in the block's fields: a code block's `lang`, or a plugin's own. */
	props?: Props;
	/** Plugin blocks only: the plugin's stored type and its nested document. */
	plugin?: string;
	blocks?: StoredBlock[];
}

// The stored form is shared with the server (validation, search text, the HTML converter).
export { isMd, MD, type StoredBlock } from './model';

/**
 * What a block holds: nothing (divider), inline-formatted text (paragraph, heading, list item…), plain text
 * without formatting (code), or a nested list of blocks (box).
 */
export type Content = 'none' | 'text' | 'plain' | 'blocks';

/** Content of the built-in block types. */
export const BUILT_IN_CONTENT: Record<Exclude<BlockType, 'plugin'>, Content> = {
	p: 'text',
	h1: 'text',
	h2: 'text',
	h3: 'text',
	h4: 'text',
	h5: 'text',
	h6: 'text',
	ul: 'text',
	ol: 'text',
	todo: 'text',
	quote: 'text',
	code: 'plain',
	hr: 'none'
};

/** One editable property, a field on the top of the block. */
export interface PropField {
	key: string;
	label: string;
	/**
	 * 'toggles' is a row of icon buttons, each switching one of `options` on or off; stored as the list of the ones on
	 * (in `options` order).
	 * 'slider' steps through `options` in their order (e.g. heights), or, with `min` and `max`, sets a number freely.
	 */
	kind: 'text' | 'textarea' | 'color' | 'select' | 'slider' | 'toggles';
	placeholder?: string;
	/** A number slider: its range, step (default 1) and unit shown after the value. */
	min?: number;
	max?: number;
	step?: number;
	unit?: string;
	/**
	 * The label of the unset state, where the key is removed: a number slider's position left of `min` (e.g. 'Original'),
	 * or an optional colour ('None'; `placeholder` is the colour a click on it starts from).
	 */
	none?: string;
	/**
	 * A slider with a value per view (e.g. the page's widths); the host sets the current view with `provideView`, a badge
	 * shows which one is edited. The first view is
	 * the base; each other view, while it has no value of its own, takes the one before it. Stored as the base value
	 * alone, or, with own values for other views, as an object by view key.
	 */
	views?: { key: string; label: string }[];
	/** For 'select', 'slider' and 'toggles' (where `icon` is the button and `label` its tooltip). */
	options?: { value: string; label: string; icon?: Icon }[];
	/** The field's text from the stored value; default: the value as a string. */
	format?: (value: unknown) => string;
	/** The stored value from the field's text (e.g. a list from lines, an id from a URL); default: the text. '' removes the key. */
	parse?: (text: string) => unknown;
}

/** What a plugin component receives. `props` and `blocks` are bindable. */
export interface PluginViewProps<P extends Props = Props> {
	props: P;
	blocks: StoredBlock[];
	readonly: boolean;
	/** The host editor's palette and plugins, for a nested editor. */
	palette: string[];
	plugins: BlockPlugin[];
}

/** What a plugin's preview receives: the block as stored, and the plugins to render its nested blocks with. */
export interface PluginPreviewProps<P extends Props = Props> {
	props: P;
	blocks: StoredBlock[];
	plugins: BlockPlugin[];
}

/** A custom block for the slash menu. */
/** A GFM table read from markdown: the cells as inline markdown, row by row (the first row is the header), and the
 * alignment of each column. */
export interface MarkdownTable {
	rows: string[][];
	align: ('left' | 'center' | 'right')[];
}

/** What a plugin's `markdown` gets beside its props. */
export interface MarkdownContext {
	/** The nested blocks as markdown ('' when it has none). */
	inner: string;
}

export interface BlockPlugin<P extends Props = Props> {
	/** Stored `type`; must not start with 'md:'. */
	type: string;
	label: string;
	hint: string;
	keys: string;
	icon: Icon;
	/** Properties of a new block. */
	props: () => P;
	/** Its fields, on the top of the block. */
	fields?: PropField[];
	/** The mini label on the top of the block (before its fields). */
	tag(props: P): string;
	/** What the block holds; decides what "Turn into" can offer. 'blocks' gets a nested document. */
	content: Content;
	/** In the editor. */
	view: Component<PluginViewProps<any>, {}, 'props' | 'blocks'>;
	/**
	 * On the site: the block as it will be rendered by `<Preview>`. Optional: an app with its own renderer leaves it out,
	 * and `<Preview>` then skips the block.
	 */
	preview?: Component<PluginPreviewProps<any>>;
	/**
	 * For a plugin with nested blocks: the blocks it takes, as palette ids ('md:p', 'youtube'…); 'md:*' stands for every
	 * built-in block. Its nested editor offers the host's palette narrowed to these. Default: everything the host has.
	 */
	accepts?: string[];
	/**
	 * Its markdown form (copying as text, export); `inner` holds its nested blocks already as markdown. Without it, or
	 * when it gives '', the block is left out of the markdown.
	 */
	markdown?(props: P, ctx: MarkdownContext): string;
	/**
	 * Takes a GFM table when markdown is pasted or imported (`fromMarkdown(src, { plugins })`): returns the block's props
	 * from the table's cells (inline markdown, the first row is the header) and its column alignments. The first plugin
	 * that has it gets the table; without one, the table stays text.
	 */
	fromTable?(table: MarkdownTable): P;
	/** Takes a `$$…$$` formula block of pasted or imported markdown (its LaTeX); the bundled `math` does. */
	fromMath?(tex: string): P;
	/**
	 * Takes files pasted into the editor or dropped on it (an image, a PDF…): returns the new block's props, or null to
	 * leave them to the next plugin. Uploading and storing them is the plugin's own business; it may take its time (a
	 * promise). The first plugin the editor offers that takes them gets one block.
	 */
	fromFiles?(files: File[]): P | null | Promise<P | null>;
	/** At most one per document, and only at the top level (e.g. a table of contents). */
	unique?: boolean;
}

export { MAX_INDENT } from './model';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const newBlock = (type: BlockType = 'p', html = '', extra: Partial<Block> = {}): Block => ({
	id: uid(),
	type,
	html,
	indent: 0,
	...extra
});

/** The start number a numbered list's first item carries (`props.start`), or 1. */
export const olStart = (props: Record<string, unknown> | undefined) => {
	const n = Math.floor(Number(props?.start));
	return n >= 0 && n < 1e9 ? n : 1;
};

/** Ordinal for every `ol` block, restarting after interruptions and per indent level. */
export function numbering(blocks: Block[]): Record<string, number> {
	const out: Record<string, number> = {};
	const counters: number[] = [];
	for (const b of blocks) {
		if (b.type === 'ol') {
			const fresh = counters[b.indent] === undefined;
			counters.length = b.indent + 1;
			// A list's first item may carry its start number (an imported "5. …").
			counters[b.indent] = fresh ? olStart(b.props) : counters[b.indent] + 1;
			out[b.id] = counters[b.indent];
		} else {
			counters.length = Math.min(counters.length, b.indent);
		}
	}
	return out;
}
