<script lang="ts" module>
	export interface MapProps extends Record<string, unknown> {
		/** Place or address, as typed into Google Maps. */
		q: string;
		/** Zoom level, 1–20. */
		zoom: string;
	}

	/** Google Maps embed for a place (no API key needed); empty without a place. */
	export const mapSrc = (p: MapProps) =>
		p.q ? `https://www.google.com/maps?q=${encodeURIComponent(p.q)}&z=${Number(p.zoom) || 15}&output=embed` : '';
</script>

<script lang="ts">
	import { useText } from '../i18n';
	import { MapPin } from '@lucide/svelte';
	import type { PluginViewProps } from '../types';
	import Empty from '../kit/Empty.svelte';

	let { props = $bindable() }: PluginViewProps<MapProps> = $props();
	const tr = useText();
	const src = $derived(mapSrc(props));
</script>

{#if src}
	<div class="overflow-hidden rounded-[10px] border border-frame">
		<!-- Not interactive inside the editor, so selecting and dragging the block keep working. -->
		<iframe class="pointer-events-none block h-[260px] w-full border-0" title={tr('Map: {place}', { place: String(props.q ?? '') })} {src} loading="lazy"></iframe>
	</div>
{:else}
	<Empty icon={MapPin} text="Set a place or an address above" />
{/if}
