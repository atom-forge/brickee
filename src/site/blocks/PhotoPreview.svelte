<script lang="ts">
	import { viewValues, type PluginPreviewProps } from '@atom-forge/brickee';
	import { findImage } from './images.svelte';
	import { aspect, type PhotoProps } from './PhotoView.svelte';
	import { VIEW_KEYS } from './views';

	let { props }: PluginPreviewProps<PhotoProps> = $props();
	const item = $derived(findImage(props.image));
	// desktop, tablet, phone: a CSS aspect-ratio each ('auto': the image's own shape), picked by container width.
	const r = $derived(viewValues(props.ratio, VIEW_KEYS).map((v) => aspect(v) ?? 'auto'));
</script>

{#if item}
	<div class="photo">
		<img src={item.url} alt={props.alt ?? ''} style:--r-desktop={r[0]} style:--r-tablet={r[1]} style:--r-phone={r[2]} />
	</div>
{/if}

<style>
	.photo {
		container-type: inline-size;
	}
	img {
		width: 100%;
		object-fit: cover;
		border-radius: 0.5rem;
		aspect-ratio: var(--r-desktop);
	}
	@container (max-width: 40rem) {
		img {
			aspect-ratio: var(--r-tablet);
		}
	}
	@container (max-width: 24rem) {
		img {
			aspect-ratio: var(--r-phone);
		}
	}
</style>
