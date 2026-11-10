<script lang="ts" module>
	export interface YouTubeProps extends Record<string, unknown> {
		id: string;
		title: string;
	}
</script>

<script lang="ts">
	import { Play, SquarePlay } from '@lucide/svelte';
	import type { PluginViewProps } from '../types';
	import Empty from '../kit/Empty.svelte';

	let { props = $bindable() }: PluginViewProps<YouTubeProps> = $props();
	const id = $derived(/^[\w-]{11}$/.test(props.id ?? '') ? props.id : '');
</script>

{#if id}
	<div class="yt">
		<img src="https://i.ytimg.com/vi/{id}/hqdefault.jpg" alt={props.title} draggable="false" />
		<span class="play"><Play size={22} /></span>
	</div>
{:else}
	<Empty icon={SquarePlay} text="Paste a YouTube link above" />
{/if}

<style>
	.yt {
		position: relative;
		border-radius: 10px;
		overflow: hidden;
		background: #000;
	}
	img {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		opacity: 0.85;
	}
	.play {
		position: absolute;
		inset: 0;
		margin: auto;
		width: 56px;
		height: 40px;
		display: grid;
		place-items: center;
		border-radius: 10px;
		background: #dc2626;
		color: #fff;
	}
</style>
