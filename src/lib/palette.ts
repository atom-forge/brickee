import {
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Heading5,
	Heading6,
	List,
	ListOrdered,
	ListTodo,
	Pilcrow,
	SeparatorHorizontal,
	SquareCode,
	TextQuote
} from '@lucide/svelte';

export type Icon = typeof Pilcrow;

export interface PaletteItem {
	/** The stored type: md:p, md:h1… for built-in blocks, the plugin's type for plugins. */
	id: string;
	label: string;
	hint: string;
	/** Extra search words for the slash menu. */
	keys: string;
	icon: Icon;
}

/** Every built-in block the slash menu can offer, in the default order. */
export const PALETTE_ITEMS: PaletteItem[] = [
	{ id: 'md:p', label: 'Text', hint: 'Plain paragraph', keys: 'text paragraph', icon: Pilcrow },
	{ id: 'md:h1', label: 'Heading 1', hint: 'Large heading', keys: 'heading h1 title', icon: Heading1 },
	{ id: 'md:h2', label: 'Heading 2', hint: 'Medium heading', keys: 'heading h2 title', icon: Heading2 },
	{ id: 'md:h3', label: 'Heading 3', hint: 'Small heading', keys: 'heading h3 title', icon: Heading3 },
	{ id: 'md:h4', label: 'Heading 4', hint: 'Sub-heading', keys: 'heading h4 title', icon: Heading4 },
	{ id: 'md:h5', label: 'Heading 5', hint: 'Minor heading', keys: 'heading h5 title', icon: Heading5 },
	{ id: 'md:h6', label: 'Heading 6', hint: 'Smallest heading', keys: 'heading h6 title', icon: Heading6 },
	{ id: 'md:ul', label: 'Bulleted list', hint: 'Simple bullets', keys: 'bullet list ul', icon: List },
	{ id: 'md:ol', label: 'Numbered list', hint: 'Ordered items', keys: 'numbered ordered list ol', icon: ListOrdered },
	{ id: 'md:todo', label: 'To-do', hint: 'Checkable item', keys: 'todo task checkbox', icon: ListTodo },
	{ id: 'md:quote', label: 'Quote', hint: 'Highlighted quote', keys: 'quote blockquote', icon: TextQuote },
	{ id: 'md:code', label: 'Code', hint: 'Monospaced block', keys: 'code snippet pre', icon: SquareCode },
	{ id: 'md:hr', label: 'Divider', hint: 'Horizontal line', keys: 'divider hr line separator', icon: SeparatorHorizontal }
];

/** Palette ids of every built-in block (md:p, md:h1…), in the default order. */
export const BUILT_IN_IDS = PALETTE_ITEMS.map((it) => it.id);

import { acceptsId } from './model';

export { acceptsId };

/** The palette of a container's nested editor: the host's, narrowed to what the container accepts (in the host's order). */
export const narrowPalette = (palette: string[], accepts: readonly string[] | undefined) =>
	accepts ? palette.filter((id) => acceptsId(accepts, id)) : palette;
