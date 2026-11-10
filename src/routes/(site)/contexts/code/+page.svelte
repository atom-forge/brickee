<script lang="ts">
	import { DocInlineCode, DocShowCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle } from '@atom-forge/ui';

	import Example from './examples/Example.svelte';
	import example from './examples/Example.svelte?raw';

	const api = `interface CodeLanguage {
	value: string;  // stored in the block: props.lang
	label?: string; // shown in the dropdown (default: the value)
}
function provideCodeLanguages(own: () => (string | CodeLanguage)[] | undefined): void;
function useCodeLanguages(): () => CodeLanguage[]; // empty: free text`;
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>Code languages</ProseTitle>
		<ProseText>
			A code block's language is free text by default. When the host knows which languages its site can highlight, it
			gives the list with <DocInlineCode>provideCodeLanguages</DocInlineCode>, and the field becomes a dropdown of them,
			with <em>None</em> first. Nested editors inherit the list. A stored language that is missing from the list stays an
			option, so an older document loses nothing.
		</ProseText>
		<DocShowCode code={api} file="code.ts" />
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>A dropdown of four languages</ProseTitle>
		<DocShowExample class="block" component={Example} code={example} />
	</ProseParagraph>
</ProsePage>
