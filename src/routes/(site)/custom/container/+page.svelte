<script lang="ts">
	import { DocInlineCode, DocShowCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle } from '@atom-forge/ui';

	import Example from './examples/Example.svelte';
	import example from './examples/Example.svelte?raw';
	import noteTs from '$site/blocks/note.ts?raw';
	import noteView from '$site/blocks/NoteView.svelte?raw';
	import notePreview from '$site/blocks/NotePreview.svelte?raw';

	const files = [
		{ name: 'note.ts', language: 'typescript', code: noteTs },
		{ name: 'NoteView.svelte', language: 'svelte', code: noteView },
		{ name: 'NotePreview.svelte', language: 'svelte', code: notePreview }
	];
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>Containers</ProseTitle>
		<ProseText>
			A plugin with <DocInlineCode>content: 'blocks'</DocInlineCode> holds a nested document in <DocInlineCode>blocks</DocInlineCode>.
			Its view uses <DocInlineCode>Frame</DocInlineCode> — a thin box with the block's fields on top and a nested editor below —
			and its preview renders the inner blocks with a nested <DocInlineCode>Preview</DocInlineCode>. Nesting is one level deep;
			<DocInlineCode>accepts</DocInlineCode> narrows what the nested editor offers (<DocInlineCode>'md:*'</DocInlineCode> is every built-in block).
		</ProseText>
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>A note box</ProseTitle>
		<ProseText>Its markdown form is a quote, with the inner blocks' markdown in <DocInlineCode>ctx.inner</DocInlineCode>.</ProseText>
		<DocShowCode code={files} />
		<DocShowExample class="block" component={Example} code={example} />
	</ProseParagraph>
</ProsePage>
