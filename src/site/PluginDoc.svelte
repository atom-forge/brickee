<script lang="ts">
	// One bundled plugin's page: what it is, its stored props, a live example and how to import it.
	import { DocApiBlock, DocApiTable, DocShowCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle, type PropDef } from '@atom-forge/ui';
	import type { Component, Snippet } from 'svelte';

	let { title, name, type, props, example, code, markdown, children }: {
		title: string;
		/** The export name in @atom-forge/brickee/plugins. */
		name: string;
		/** The stored block type. */
		type: string;
		props: PropDef[];
		example: Component;
		code: string;
		/** Its markdown form, in words. */
		markdown: string;
		children: Snippet;
	} = $props();

	const usage = $derived(`import { Editor, Preview } from '@atom-forge/brickee';
import { ${name} } from '@atom-forge/brickee/plugins';

const plugins = [${name}];
// <Editor bind:value {plugins} />  ·  <Preview blocks={value} {plugins} />`);
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>{title}</ProseTitle>
		<ProseText>{@render children()}</ProseText>
		<DocShowCode code={usage} file="usage.ts" />
		<DocApiBlock title={`Stored props · type "${type}"`}>
			<DocApiTable {props} />
		</DocApiBlock>
		<ProseText>Markdown form: {markdown}</ProseText>
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>Live</ProseTitle>
		<DocShowExample class="block" component={example} {code} />
	</ProseParagraph>
</ProsePage>
