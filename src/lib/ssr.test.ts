// @vitest-environment node
// Server-side rendering: an app may render pages with an editor or a preview on the server, where there is no window.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Editor from './Editor.svelte';
import Preview from './Preview.svelte';
import { PLUGINS } from './plugins';
import type { StoredBlock } from './types';

const doc: StoredBlock[] = [
	{ type: 'md:h2', indent: 0, text: 'Title' },
	{ type: 'md:p', indent: 0, text: 'Some **text**' },
	{ type: 'md:ol', indent: 0, text: 'five', props: { start: 5 } },
	{ type: 'md:code', indent: 0, text: 'x', props: { lang: 'ts' } },
	{ type: 'table', indent: 0, props: { rows: [['a', 'b'], ['1', '2']], heads: ['top'] } },
	{ type: 'youtube', indent: 0, props: { id: 'jNQXAC9IVRw', title: 'Zoo' } },
	{ type: 'map', indent: 0, props: { q: 'Pécs', zoom: '15' } },
	{ type: 'gap', indent: 0, props: { lines: '2' } }
];

describe('server-side rendering', () => {
	it('renders the editor', () => {
		const { body } = render(Editor, { props: { value: doc, plugins: PLUGINS } });
		expect(body).toContain('Title');
	});
	it('renders a read-only editor', () => {
		const { body } = render(Editor, { props: { value: doc, plugins: PLUGINS, readonly: true } });
		expect(body).toContain('Title');
	});
	it('renders the preview', () => {
		const { body } = render(Preview, { props: { blocks: doc, plugins: PLUGINS } });
		expect(body).toContain('<b>text</b>');
		expect(body).toContain('start="5"');
	});
});
