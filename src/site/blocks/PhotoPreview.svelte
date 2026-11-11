<script lang="ts">
	import type { PluginPreviewProps } from '@atom-forge/brickee';
	import { findImage } from './images.svelte';
	import { aspect, type PhotoProps } from './PhotoView.svelte';

	let { props }: PluginPreviewProps<PhotoProps> = $props();
	const item = $derived(findImage(props.image));
</script>

{#if item}
	<img src={item.url} alt={props.alt ?? ''} class="w-full rounded-lg object-cover" style:aspect-ratio={aspect(props.ratio)} />
{/if}
