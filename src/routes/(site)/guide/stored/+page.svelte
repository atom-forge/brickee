<script lang="ts">
	import { DocInlineCode, DocShowCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle } from '@atom-forge/ui';

	import Json from './examples/Json.svelte';
	import json from './examples/Json.svelte?raw';
	import Validate from './examples/Validate.svelte';
	import validate from './examples/Validate.svelte?raw';

	const model = `interface StoredBlock {
	type: string;                     // 'md:p', 'md:h2', 'md:ul'… or a plugin's type
	indent: number;                   // 0…6
	text?: string;                    // inline markdown (raw text for md:code)
	props?: Record<string, unknown>;  // a plugin's settings; md:todo { checked }, md:code { lang }
	blocks?: StoredBlock[];           // a container's nested document (one level)
}`;
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>Stored form</ProseTitle>
		<ProseText>
			A document is <DocInlineCode>StoredBlock[]</DocInlineCode>: plain JSON, written back by the editor on every change.
			Store it as it is. Built-in types start with <DocInlineCode>md:</DocInlineCode>; any other type is a plugin's, so
			never rename a plugin's type — stored documents refer to it.
		</ProseText>
		<DocShowCode code={model} file="model.ts" />
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>The JSON, live</ProseTitle>
		<ProseText>Edit the document and watch its stored form. Lists are blocks with an <DocInlineCode>indent</DocInlineCode>, not nested arrays.</ProseText>
		<DocShowExample class="block" component={Json} code={json} />
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>Validating on the server</ProseTitle>
		<ProseText><DocInlineCode>blocksSchemaFor(plugins)</DocInlineCode> from <DocInlineCode>@atom-forge/brickee/schema</DocInlineCode> is a zod schema for saved documents. Break the JSON to see the errors.</ProseText>
		<DocShowExample class="block" component={Validate} code={validate} />
	</ProseParagraph>
</ProsePage>
