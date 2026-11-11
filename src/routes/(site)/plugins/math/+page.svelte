<script lang="ts">
	import { DocInlineCode } from '@atom-forge/ui';
	import PluginDoc from '$site/PluginDoc.svelte';
	import { DocShowExample, ProseParagraph, ProseText, ProseTitle } from '@atom-forge/ui';
	import Example from './examples/Example.svelte';
	import code from './examples/Example.svelte?raw';
	import Inline from './examples/Inline.svelte';
	import inlineCode from './examples/Inline.svelte?raw';
</script>

<PluginDoc title="Formula" name="math" type="math" example={Example} {code} markdown="a $$ … $$ block (GitHub and Obsidian read it the same way); a pasted one becomes a formula block."
	props={[{ name: 'tex', type: 'string', description: 'The formula in LaTeX.' }]}>
	A formula on its own line, written in LaTeX and drawn as MathML by <DocInlineCode>temml</DocInlineCode> (browsers show
	MathML natively; it also renders on the server). It lives in its own entry point,
	<DocInlineCode>@atom-forge/brickee/math</DocInlineCode>, with <DocInlineCode>temml</DocInlineCode> as an optional peer
	dependency: <DocInlineCode>bun add temml</DocInlineCode>.
</PluginDoc>

<ProseParagraph>
	<ProseTitle level={3}>Inside the text</ProseTitle>
	<ProseText>
		<DocInlineCode>inlineMath</DocInlineCode> is an inline plugin: a formula in a block's text, stored as
		<DocInlineCode>$…$</DocInlineCode> (no space just inside the dollars, no digit after the closing one, so prices stay
		text). Typing <DocInlineCode>$a^2$</DocInlineCode> and a space makes one, the toolbar's Σ turns the selected text into
		one, and a click opens it for editing.
	</ProseText>
	<DocShowExample class="block" component={Inline} code={inlineCode} />
</ProseParagraph>
