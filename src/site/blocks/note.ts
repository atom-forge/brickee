import { StickyNote } from '@lucide/svelte';
import { mdJoin, mdQuote, mdText, type BlockPlugin } from '@atom-forge/brickee';
import NoteView, { type NoteProps } from './NoteView.svelte';
import NotePreview from './NotePreview.svelte';

export const note: BlockPlugin<NoteProps> = {
	type: 'note',
	label: 'Note',
	hint: 'Boxed text with a title',
	keys: 'note aside box',
	icon: StickyNote,
	props: () => ({ title: '' }),
	fields: [{ key: 'title', label: 'Title', kind: 'text' }],
	tag: () => 'note',
	content: 'blocks', // holds a nested document in `blocks`
	accepts: ['md:p', 'md:ul', 'md:ol', 'youtube'], // what the nested editor offers
	markdown: (p, { inner }) => mdQuote(mdJoin(p.title && `**${mdText(p.title)}**`, inner)),
	view: NoteView,
	preview: NotePreview
};
