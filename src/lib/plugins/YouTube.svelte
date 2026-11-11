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
	<div class="relative overflow-hidden rounded-[10px] bg-black">
		<img class="block aspect-video w-full object-cover opacity-85" src="https://i.ytimg.com/vi/{id}/hqdefault.jpg" alt={props.title} draggable="false" />
		<span class="absolute inset-0 m-auto grid h-10 w-14 place-items-center rounded-[10px] bg-red-600 text-white"><Play size={22} /></span>
	</div>
{:else}
	<Empty icon={SquarePlay} text="Paste a YouTube link above" />
{/if}
