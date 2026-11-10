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

<div class="frame">
	{#if fields}
		<div class="fields">{@render fields()}</div>
	{:else if heading || empty || image}
		<div class="head">
			{#if image}<img src={image} alt="" draggable="false" />{/if}
			<span class:muted={!heading}>{heading || empty}</span>
		</div>
	{/if}
	<Editor bind:value={blocks} {readonly} {palette} {plugins} nested placeholder={placeholder ?? tr('Write inside…')} />
</div>

<style>
	.frame {
		position: relative;
		border: 1px solid var(--color-frame, #e5e5ea);
		border-radius: 10px;
		/* left: room for the inner blocks' handle bar (22px left of the row, which reaches 8px out) */
		padding: 0.8em 1.1em 0.4em calc(30px + 0.5em);
	}
	/* the fields reach to the frame's edges, the frame's padding taken back */
	.fields {
		margin: calc(-0.8em + 4px) calc(-1.1em + 4px) 0.5em calc(-30px - 0.5em + 4px);
	}
	.head {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0 9em 0.3em 0;
		font: 600 13px/1.4 system-ui, sans-serif;
		color: var(--color-surface-contrast, #1d1d1f);
	}
	.head img {
		height: 28px;
		width: 44px;
		object-fit: cover;
		border-radius: 4px;
	}
	.muted {
		font-weight: 400;
		color: var(--color-muted-contrast, #a0a0a8);
	}
</style>
