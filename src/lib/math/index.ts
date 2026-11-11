// Formulas: a block formula (`math`, `$$…$$` in markdown) and a formula inside the text (`inlineMath`, `$…$`). Rendered
// with Temml as MathML, which browsers show natively and which also renders on the server. Its own entry point, because
// it needs `temml` (an optional peer dependency): an app that does not import it does not get it.
import { Sigma } from '@lucide/svelte';
import type { BlockPlugin, InlinePlugin } from '../types';
import MathView, { type MathProps } from './MathView.svelte';
import MathPreview from './MathPreview.svelte';
import { tex } from './tex';

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

/**
 * A formula inside the text: `$x^2$`. The GitHub and Obsidian rule: no space just inside the dollars and no digit
 * after the closing one, so "$5 and $10" stays text; `\$` is a dollar. Typed `$…$` becomes one; click it to edit.
 */
export const inlineMath: InlinePlugin<{ tex: string }> = {
	type: 'math',
	label: 'Formula',
	icon: Sigma,
	pattern: /(?<![\\$])\$(?![\s$])([^$\n]{1,500}?)(?<![\s\\])\$(?!\d)/g,
	parse: (m) => ({ tex: m[1] }),
	markdown: (d) => '$' + d.tex + '$',
	render: (d) => (d.tex.trim() ? tex(d.tex, false) : ''),
	fields: [{ key: 'tex', label: 'Formula (LaTeX)', kind: 'text', placeholder: 'e.g. x^2' }],
	create: (text) => ({ tex: text }),
	typing: { open: '$', close: '$' }
};

export { tex } from './tex';
export type { MathProps };
