<script lang="ts">
	// Development page (not linked from the site): every look of the editor in one place, for the screenshot check
	// (scripts/shots.mjs). Keep it stable: the shots compare against it.
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { button } from '$site/blocks/button';
	import { note } from '$site/blocks/note';

	const plugins = [...PLUGINS, button, note];
	const doc = (): StoredBlock[] => [
		{ type: 'md:h2', indent: 0, text: 'Heading two' },
		{ type: 'md:p', indent: 0, text: 'A paragraph with **bold**, *italic*, <u>underline</u>, ~~strike~~, `code` and a [link](https://x.y).' },
		{ type: 'md:ul', indent: 0, text: 'Bullet' },
		{ type: 'md:ul', indent: 1, text: 'Nested bullet' },
		{ type: 'md:ol', indent: 0, text: 'Numbered' },
		{ type: 'md:ol', indent: 0, text: 'Numbered again' },
		{ type: 'md:todo', indent: 0, text: 'Done item', props: { checked: true } },
		{ type: 'md:todo', indent: 0, text: 'Open item', props: { checked: false } },
		{ type: 'md:quote', indent: 0, text: 'A quote' },
		{ type: 'md:code', indent: 0, text: 'const x = 1;', props: { lang: 'ts' } },
		{ type: 'md:hr', indent: 0 },
		{ type: 'table', indent: 0, props: { rows: [['Head', 'Price'], ['Tea', '€2'], ['Sum', '€2']], heads: ['top', 'bottom'], align: ['left', 'right'] } },
		{ type: 'gap', indent: 0, props: { lines: '2' } },
		{ type: 'button', indent: 0, props: { label: 'Click', url: 'https://x.y', color: '#ea580c' } },
		{ type: 'map', indent: 0, props: { q: '', zoom: '15' } },
		{ type: 'youtube', indent: 0, props: { id: '', title: '' } },
		{ type: 'note', indent: 0, props: { title: 'A note' }, blocks: [{ type: 'md:p', indent: 0, text: 'Inside the box' }] },
		{ type: 'mystery', indent: 0, props: {} },
		{ type: 'md:p', indent: 0, text: '' }
	];
	let value = $state(doc());
	const readonly = doc().slice(0, 12);
</script>

<div class="space-y-8 p-6">
	<section data-shot="editor" class="max-w-2xl pl-6"><Editor bind:value {plugins} /></section>
	<section data-shot="readonly" class="max-w-2xl pl-6"><Editor value={readonly} {plugins} readonly /></section>
	<section data-shot="preview" class="prose max-w-2xl dark:prose-invert"><Preview blocks={value} {plugins} /></section>
</div>
