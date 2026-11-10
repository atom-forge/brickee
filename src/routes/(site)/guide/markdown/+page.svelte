<script lang="ts">
	import { DocInlineCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle } from '@atom-forge/ui';

	import Export from './examples/Export.svelte';
	import exportCode from './examples/Export.svelte?raw';
	import Import from './examples/Import.svelte';
	import importCode from './examples/Import.svelte?raw';
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>Markdown</ProseTitle>
		<ProseText>
			The built-in blocks are markdown, so a document reads and copies as markdown. Plugins join in with an optional
			<DocInlineCode>markdown</DocInlineCode> form: the table becomes a GFM table, the video and the map a link, and a
			plugin without one is left out. Copying blocks in the editor uses the same conversion.
		</ProseText>
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>Export</ProseTitle>
		<ProseText><DocInlineCode>toMarkdown(blocks, {'{ plugins }'})</DocInlineCode> works on the editor's blocks, so convert the stored form with <DocInlineCode>fromStored</DocInlineCode> first.</ProseText>
		<DocShowExample class="block" component={Export} code={exportCode} />
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>Import</ProseTitle>
		<ProseText><DocInlineCode>fromMarkdown(text)</DocInlineCode> makes one block per non-empty line — headings, lists, to-dos, quotes, fenced code, dividers and inline marks. It knows the built-in blocks only.</ProseText>
		<DocShowExample class="block" component={Import} code={importCode} />
	</ProseParagraph>
</ProsePage>
