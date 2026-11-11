// Formulas: a block formula (`math`, `$$…$$` in markdown). Rendered with Temml as MathML, which browsers show natively
// and which also renders on the server. Its own entry point, because it needs `temml` (an optional peer dependency):
// an app that does not import it does not get it.
import { Sigma } from '@lucide/svelte';
import type { BlockPlugin } from '../types';
import MathView, { type MathProps } from './MathView.svelte';
import MathPreview from './MathPreview.svelte';

/** A formula on its own line, written in LaTeX. */
export const math: BlockPlugin<MathProps> = {
	type: 'math',
	label: 'Formula',
	hint: 'A formula in LaTeX',
	keys: 'math formula equation latex tex',
	icon: Sigma,
	props: () => ({ tex: '' }),
	fields: [{ key: 'tex', label: 'Formula (LaTeX)', kind: 'textarea', placeholder: 'e.g. E = mc^2' }],
	tag: () => 'formula',
	content: 'none',
	markdown: (p) => (String(p.tex ?? '').trim() ? `$$\n${String(p.tex).trim()}\n$$` : ''),
	fromMath: (tex) => ({ tex }),
	view: MathView,
	preview: MathPreview
};

export { tex } from './tex';
export type { MathProps };
