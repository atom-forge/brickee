<!-- The editor look of a plugin with nested blocks: a thin frame with the block's fields on its top (or, read-only, a
     heading line), and the nested editor. -->
<script lang="ts">
	import { useText } from '../i18n';
	import Editor from '../Editor.svelte';
	import { claimFields } from '../PluginHost.svelte';
	import type { BlockPlugin, StoredBlock } from '../types';

	interface Props {
		blocks: StoredBlock[];
		readonly: boolean;
		palette: string[];
		plugins: BlockPlugin[];
		/** Summary of the block's props (title…); `empty` is shown when there is none. */
		heading?: string;
		empty?: string;
		image?: string;
		placeholder?: string;
	}
	let {
		blocks = $bindable(),
		readonly,
		palette,
		plugins,
		heading = '',
		empty = '',
		image,
		placeholder
	}: Props = $props();
	const tr = useText();
	const fields = claimFields();
</script>

<!-- left padding: room for the inner blocks' handle bar (22px left of the row, which reaches 8px out); the fields reach
     to the frame's edges, its padding taken back -->
<div class="relative rounded-[10px] border border-frame pt-[0.8em] pr-[1.1em] pb-[0.4em] pl-[calc(30px+0.5em)]">
	{#if fields}
		<div class="mt-[calc(-0.8em+4px)] mr-[calc(-1.1em+4px)] mb-[0.5em] ml-[calc(-30px-0.5em+4px)]">{@render fields()}</div>
	{:else if heading || empty || image}
		<div class="mr-[9em] mb-[0.3em] flex items-center gap-2 font-sans text-[13px] leading-[1.4] font-semibold text-surface-contrast">
			{#if image}<img class="h-7 w-11 rounded object-cover" src={image} alt="" draggable="false" />{/if}
			<span class={heading ? '' : 'font-normal text-muted-contrast'}>{heading || empty}</span>
		</div>
	{/if}
	<Editor bind:value={blocks} {readonly} {palette} {plugins} nested placeholder={placeholder ?? tr('Write inside…')} />
</div>
