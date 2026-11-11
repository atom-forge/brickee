<script lang="ts" module>
	export interface PhotoProps extends Record<string, unknown> {
		/** An id from this app's image library: the app's choice (it could store a URL just as well). */
		image: string;
		alt: string;
		/** The height in % of the width (20–150), or unset for the image's own shape. */
		ratio?: unknown;
	}

	/** A CSS aspect-ratio from a stored height, or undefined. */
	export const aspect = (v: unknown) => {
		const n = Number(v);
		return n >= 20 && n <= 150 ? `100 / ${n}` : undefined;
	};
</script>

<script lang="ts">
	import type { PluginViewProps } from '@atom-forge/brickee';
	import { findImage } from './images.svelte';

	let { props = $bindable(), blocks = $bindable() }: PluginViewProps<PhotoProps> = $props();
	const item = $derived(findImage(props.image));
</script>

{#if item}
	<img src={item.url} alt={props.alt} class="w-full rounded-md object-cover" style:aspect-ratio={aspect(props.ratio)} />
{:else}
	<div class="grid h-24 place-items-center rounded-md border border-dashed border-frame text-[0.85em] text-muted-contrast">Pick an image in the fields</div>
{/if}
