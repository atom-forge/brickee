<script lang="ts">
	import { DocApiBlock, DocApiTable, DocInlineCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle, type PropDef } from '@atom-forge/ui';

	import Basic from './examples/Basic.svelte';
	import basic from './examples/Basic.svelte?raw';
	import MarkdownOnly from './examples/MarkdownOnly.svelte';
	import markdownOnly from './examples/MarkdownOnly.svelte?raw';
	import Readonly from './examples/Readonly.svelte';
	import readonly from './examples/Readonly.svelte?raw';
	import Palette from './examples/Palette.svelte';
	import palette from './examples/Palette.svelte?raw';

	const editorProps: PropDef[] = [
		{ name: 'value', type: 'StoredBlock[]', default: '[]', description: 'Bindable. The document as JSON; written back on every change. Store it as it is.' },
		{ name: 'plugins', type: 'BlockPlugin[]', default: '[]', description: 'The plugin blocks the editor can show and offer. Without it: a plain markdown editor.' },
		{ name: 'palette', type: 'string[]', description: 'Palette ids (<code>md:*</code> kinds and plugin types) the block menu offers.' },
		{ name: 'messages', type: 'Messages', description: 'UI text, e.g. <code>hu</code> from <code>@atom-forge/brickee/locales/hu</code>.' },
		{ name: 'readonly', type: 'boolean', default: 'false', description: 'Shows the document without editing.' },
		{ name: 'placeholder', type: 'string', description: 'The hint in an empty line.' }
	];
	const previewProps: PropDef[] = [
		{ name: 'blocks', type: 'StoredBlock[]', description: 'The document to render.' },
		{ name: 'plugins', type: 'BlockPlugin[]', description: 'The same plugins the editor got; blocks without a plugin <code>preview</code> are skipped.' },
		{ name: 'messages', type: 'Messages', description: 'UI text.' },
		{ name: 'markGated', type: 'boolean', default: 'true', description: 'Marks the blocks after a <code>gate</code> plugin block.' },
		{ name: 'nested', type: 'boolean', default: 'false', description: 'For container previews.' }
	];
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>Editor and preview</ProseTitle>
		<ProseText>
			<DocInlineCode>Editor</DocInlineCode> edits a document, <DocInlineCode>Preview</DocInlineCode> renders it the way the
			site shows it. Both take the same <DocInlineCode>plugins</DocInlineCode>. The preview brings only the styling it needs
			itself; headings, paragraphs and lists take the page's typography — here Tailwind's <DocInlineCode>prose</DocInlineCode>.
		</ProseText>

		<DocApiBlock title="Editor">
			<DocApiTable props={editorProps} />
		</DocApiBlock>
		<DocApiBlock title="Preview">
			<DocApiTable props={previewProps} />
		</DocApiBlock>
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>Editor beside its preview</ProseTitle>
		<ProseText>Bind <DocInlineCode>value</DocInlineCode> and render it with <DocInlineCode>Preview</DocInlineCode>. Type <DocInlineCode>/</DocInlineCode> on an empty line for the block menu; drag a block by its handle.</ProseText>
		<DocShowExample class="block" component={Basic} code={basic} />
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>A plain markdown editor</ProseTitle>
		<ProseText>Leave out <DocInlineCode>plugins</DocInlineCode> and you get the markdown blocks alone. The value is never <DocInlineCode>[]</DocInlineCode> after mount — test emptiness with <DocInlineCode>blocksToPlainText</DocInlineCode>.</ProseText>
		<DocShowExample class="block" component={MarkdownOnly} code={markdownOnly} />
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>Read-only</ProseTitle>
		<ProseText>With <DocInlineCode>readonly</DocInlineCode> the editor shows the document without handles, menus or fields.</ProseText>
		<DocShowExample class="block" component={Readonly} code={readonly} />
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>Restricting the block menu</ProseTitle>
		<ProseText>Narrow what an editor offers with <DocInlineCode>palette</DocInlineCode>, not by dropping plugins: a stored document may still hold the others.</ProseText>
		<DocShowExample class="block" component={Palette} code={palette} />
	</ProseParagraph>
</ProsePage>
