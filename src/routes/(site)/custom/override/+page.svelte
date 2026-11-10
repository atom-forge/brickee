<script lang="ts">
	import { DocInlineCode, DocShowCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle } from '@atom-forge/ui';

	import Example from './examples/Example.svelte';
	import example from './examples/Example.svelte?raw';
	import siteMapTs from '$site/blocks/siteMap.ts?raw';
	import siteMap from '$site/blocks/SiteMap.svelte?raw';

	const files = [
		{ name: 'siteMap.ts', language: 'typescript', code: siteMapTs },
		{ name: 'SiteMap.svelte', language: 'svelte', code: siteMap }
	];
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>Overriding a plugin</ProseTitle>
		<ProseText>
			A plugin is a plain object, so adapting one is a spread: keep its <DocInlineCode>type</DocInlineCode> (stored documents
			refer to it) and replace what your site does differently — usually the <DocInlineCode>preview</DocInlineCode>, sometimes
			the fields. An app with its own renderer can also leave <DocInlineCode>preview</DocInlineCode> out altogether.
		</ProseText>
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>A map with a caption</ProseTitle>
		<ProseText>The bundled map's editor view, plus a caption field and the site's own preview.</ProseText>
		<DocShowCode code={files} />
		<DocShowExample class="block" component={Example} code={example} />
	</ProseParagraph>
</ProsePage>
