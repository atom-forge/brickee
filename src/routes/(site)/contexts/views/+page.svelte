<script lang="ts">
	import { DocInlineCode, DocShowCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle } from '@atom-forge/ui';

	import Example from './examples/Example.svelte';
	import example from './examples/Example.svelte?raw';
	import viewsTs from '$site/blocks/views.ts?raw';
	import photoPreview from '$site/blocks/PhotoPreview.svelte?raw';

	const files = [
		{ name: 'views.ts', language: 'typescript', code: viewsTs },
		{ name: 'PhotoPreview.svelte', language: 'svelte', code: photoPreview }
	];
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>Per-view values</ProseTitle>
		<ProseText>
			Some settings depend on how the page is shown: an image may need another shape on a phone. A
			<DocInlineCode>slider</DocInlineCode> field with <DocInlineCode>views</DocInlineCode> stores a value per view. Which views
			exist and which one is shown is the host's business: it tells the editor with <DocInlineCode>provideView</DocInlineCode>.
			A preview reads the values with <DocInlineCode>viewValues(value, keys)</DocInlineCode>, inheritance applied.
		</ProseText>
		<ProseText>
			Stored: a base value alone stays a plain value (<DocInlineCode>"ratio": "56"</DocInlineCode>); own values for other views
			make an object keyed by view (<DocInlineCode>{'{ "desktop": "56", "phone": "100" }'}</DocInlineCode>).
		</ProseText>
		<DocShowCode code={files} />
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>Desktop, tablet, phone</ProseTitle>
		<ProseText>The preview narrows with the view, and the photo picks its ratio by its own width.</ProseText>
		<DocShowExample class="block" component={Example} code={example} />
	</ProseParagraph>
</ProsePage>
