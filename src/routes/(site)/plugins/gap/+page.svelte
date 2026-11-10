<script lang="ts">
	import { DocInlineCode } from '@atom-forge/ui';
	import PluginDoc from '$site/PluginDoc.svelte';
	import Example from './examples/Example.svelte';
	import code from './examples/Example.svelte?raw';
</script>

<PluginDoc title="Gap" name="gap" type="gap" example={Example} {code} markdown="none — it is left out."
	props={[{ name: 'lines', type: 'string', default: "'1'", description: 'The height in lines of text, 1–8 (<code>GAP_MAX</code>); can be set per view.' }]}>
	Empty space between blocks, some lines of text high; only its height can be set. <DocInlineCode>gapLines</DocInlineCode>
	clamps a stored value for your own preview.
</PluginDoc>
