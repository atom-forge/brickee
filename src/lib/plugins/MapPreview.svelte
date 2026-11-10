<svelte:options css="injected" />

<script lang="ts">
	import { useText } from '../i18n';
	import type { PluginPreviewProps } from '../types';
	import { mapSrc, type MapProps } from './Map.svelte';

	let { props }: PluginPreviewProps<MapProps> = $props();
	const tr = useText();
	const src = $derived(mapSrc(props));
</script>

{#if src}
	<iframe class="map" title={tr('Map: {place}', { place: String(props.q ?? '') })} {src} loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
{/if}

<style>
	.map {
		display: block;
		width: 100%;
		height: 300px;
		margin: 0 0 1em;
		border: 0;
		border-radius: 10px;
	}
</style>
