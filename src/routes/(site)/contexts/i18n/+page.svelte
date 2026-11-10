<script lang="ts">
	import { DocInlineCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle } from '@atom-forge/ui';

	import Example from './examples/Example.svelte';
	import example from './examples/Example.svelte?raw';
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>Localisation</ProseTitle>
		<ProseText>
			The UI text is English in the source, and the English text is the key. Pass <DocInlineCode>messages</DocInlineCode> to
			the top editor and preview — for example <DocInlineCode>hu</DocInlineCode> from
			<DocInlineCode>@atom-forge/brickee/locales/hu</DocInlineCode>, extended with your own plugins' labels, hints and keys.
			Plugins translate with <DocInlineCode>useText()</DocInlineCode>; nested editors inherit the messages.
		</ProseText>
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>Hungarian</ProseTitle>
		<ProseText>The block menu, the fields and the hints in Hungarian; the menu also searches the Hungarian keywords.</ProseText>
		<DocShowExample class="block" component={Example} code={example} />
	</ProseParagraph>
</ProsePage>
