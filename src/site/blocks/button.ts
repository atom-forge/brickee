import { MousePointerClick } from '@lucide/svelte';
import { mdText, type BlockPlugin } from '@atom-forge/brickee';
import ButtonView, { type ButtonProps } from './ButtonView.svelte';
import ButtonPreview from './ButtonPreview.svelte';

export const button: BlockPlugin<ButtonProps> = {
	type: 'button', // stored in documents: never rename it
	label: 'Button',
	hint: 'A link as a button',
	keys: 'button link cta',
	icon: MousePointerClick,
	props: () => ({ label: '', url: '', color: '#2563eb' }),
	fields: [
		{ key: 'label', label: 'Label', kind: 'text' },
		{ key: 'url', label: 'Link', kind: 'text', placeholder: 'https://…' },
		{ key: 'color', label: 'Colour', kind: 'color' }
	],
	tag: () => 'button',
	content: 'none',
	markdown: (p) => (p.url ? `[${mdText(p.label)}](${p.url})` : ''),
	view: ButtonView,
	preview: ButtonPreview
};
