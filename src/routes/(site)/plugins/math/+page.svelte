<script lang="ts">
	import { DocInlineCode } from '@atom-forge/ui';
	import PluginDoc from '$site/PluginDoc.svelte';
	import Example from './examples/Example.svelte';
	import code from './examples/Example.svelte?raw';
</script>

<PluginDoc title="Formula" name="math" type="math" example={Example} {code} markdown="a $$ … $$ block (GitHub and Obsidian read it the same way); a pasted one becomes a formula block."
	props={[{ name: 'tex', type: 'string', description: 'The formula in LaTeX.' }]}>
	A formula on its own line, written in LaTeX and drawn as MathML by <DocInlineCode>temml</DocInlineCode> (browsers show
	MathML natively; it also renders on the server). It lives in its own entry point,
	<DocInlineCode>@atom-forge/brickee/math</DocInlineCode>, with <DocInlineCode>temml</DocInlineCode> as an optional peer
	dependency: <DocInlineCode>bun add temml</DocInlineCode>.
</PluginDoc>
