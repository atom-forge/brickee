<svelte:options css="injected" />

<script lang="ts">
	import { useText } from '../i18n';
	import type { PluginPreviewProps } from '../types';
	import type { YouTubeProps } from './YouTube.svelte';

	let { props }: PluginPreviewProps<YouTubeProps> = $props();
	const tr = useText();
	const id = $derived(/^[\w-]{11}$/.test(props.id ?? '') ? props.id : '');
	// The player loads only on click (no YouTube request before that but the thumbnail).
	let playing = $state(false);
</script>

{#if id}
	<figure class="yt">
		{#if playing}
			<iframe
				src="https://www.youtube-nocookie.com/embed/{id}?autoplay=1"
				title={props.title || tr('YouTube video')}
				allow="autoplay; encrypted-media; picture-in-picture"
				allowfullscreen
			></iframe>
		{:else}
			<button type="button" onclick={() => (playing = true)} aria-label={tr('Play {title}', { title: props.title || tr('video') })}>
				<img src="https://i.ytimg.com/vi/{id}/hqdefault.jpg" alt="" />
				<span class="play" aria-hidden="true">▶</span>
			</button>
		{/if}
		{#if props.title}<figcaption>{props.title}</figcaption>{/if}
	</figure>
{/if}

<style>
	.yt {
		margin: 0 0 1em;
	}
	iframe,
	button {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
		border: 0;
		border-radius: 8px;
	}
	button {
		position: relative;
		padding: 0;
		overflow: hidden;
		background: #000;
		cursor: pointer;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.play {
		position: absolute;
		inset: 0;
		margin: auto;
		width: 64px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 12px;
		background: #dc2626;
		color: #fff;
		font-size: 20px;
	}
	figcaption {
		margin-top: 0.4em;
		color: color-mix(in srgb, currentColor 65%, transparent);
		font: 13px/1.4 system-ui, sans-serif;
	}
</style>
