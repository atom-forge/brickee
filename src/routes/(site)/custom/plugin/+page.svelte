<script lang="ts">
	import { DocApiBlock, DocApiTable, DocInlineCode, DocShowCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle, type PropDef } from '@atom-forge/ui';

	import Example from './examples/Example.svelte';
	import example from './examples/Example.svelte?raw';
	import buttonTs from '$site/blocks/button.ts?raw';
	import buttonView from '$site/blocks/ButtonView.svelte?raw';
	import buttonPreview from '$site/blocks/ButtonPreview.svelte?raw';

	const files = [
		{ name: 'button.ts', language: 'typescript', code: buttonTs },
		{ name: 'ButtonView.svelte', language: 'svelte', code: buttonView },
		{ name: 'ButtonPreview.svelte', language: 'svelte', code: buttonPreview }
	];

	const plugin: PropDef[] = [
		{ name: 'type', type: 'string', description: 'The stored block type. Not <code>md:</code>; never rename it.' },
		{ name: 'label · hint · keys · icon', type: 'string · string · string · Icon', description: 'How the block menu shows and finds it.' },
		{ name: 'props', type: '() => P', description: "A new block's props." },
		{ name: 'fields', type: 'PropField[]', description: 'The settings on the top of the block: text, textarea, color, select, slider, toggles (icon buttons).' },
		{ name: 'tag', type: '(props) => string', description: 'The mini label beside the block.' },
		{ name: 'content', type: "'none' | 'blocks'", description: "<code>'blocks'</code> for a container." },
		{ name: 'view', type: 'Component', description: 'The editor view; declares <code>props</code> and <code>blocks</code> as <code>$bindable()</code>.' },
		{ name: 'preview', type: 'Component', description: 'Optional. The site rendering; sanitizes its props.' },
		{ name: 'markdown', type: '(props, { inner }) => string', description: "Optional. Its markdown form; <code>''</code> leaves it out." },
		{ name: 'accepts · unique', type: 'string[] · boolean', description: 'Container content, and at most one per document.' },
		{ name: 'fromTable', type: '(table) => P', description: 'Optional. Takes a pasted GFM table.' }
	];
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>Writing a plugin</ProseTitle>
		<ProseText>
			A plugin is a plain <DocInlineCode>BlockPlugin</DocInlineCode> object: a block type with an editor view, a site
			preview, fields and optionally a markdown form. The bundled plugins are written the same way, with only what the
			core exports. Props are untrusted user input: the preview checks links and colours (<DocInlineCode>safeColor</DocInlineCode>)
			and never renders them with <DocInlineCode>{'{@html}'}</DocInlineCode>.
		</ProseText>
		<DocApiBlock title="BlockPlugin">
			<DocApiTable props={plugin} />
		</DocApiBlock>
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>A button block</ProseTitle>
		<ProseText>Three files: the plugin object, its editor view and its preview.</ProseText>
		<DocShowCode code={files} />
		<DocShowExample class="block" component={Example} code={example} />
	</ProseParagraph>
</ProsePage>
