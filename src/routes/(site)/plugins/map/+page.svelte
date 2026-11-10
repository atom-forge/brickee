<script lang="ts">
	import { DocInlineCode } from '@atom-forge/ui';
	import PluginDoc from '$site/PluginDoc.svelte';
	import Example from './examples/Example.svelte';
	import code from './examples/Example.svelte?raw';
</script>

<PluginDoc title="Map" name="map" type="map" example={Example} {code} markdown="a Google Maps search link for the place."
	props={[
		{ name: 'q', type: 'string', description: 'A place or an address.' },
		{ name: 'zoom', type: 'string', default: "'15'", description: 'Zoom level, 1–20 (a slider).' }
	]}>
	A Google Maps embed of a place or an address, no API key needed. <DocInlineCode>mapSrc(props)</DocInlineCode> gives
	the embed address for your own preview.
</PluginDoc>
