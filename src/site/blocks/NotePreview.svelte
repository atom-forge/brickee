<script lang="ts">
	import { Preview, type PluginPreviewProps } from '@atom-forge/brickee';
	import type { NoteProps } from './NoteView.svelte';

	let { props, blocks, plugins }: PluginPreviewProps<NoteProps> = $props();
</script>

<aside class="my-4 rounded-lg border-l-4 border-amber-500 bg-amber-500/10 px-4 py-1">
	{#if props.title}<p class="font-bold">{props.title}</p>{/if}
	<Preview {blocks} {plugins} nested />
</aside>
