<!-- The image picker popup of an image field (see PropsBar): every image attached to the document, grouped. One image:
     a click picks it and closes; several: clicks add and remove (the numbers show the order), Done or Escape closes. -->
<script lang="ts">
	import { Button, getPopupManager } from '@atom-forge/ui';
	import type { Translate } from './i18n';
	import type { MediaItem } from './media';

	interface Props {
		media: MediaItem[];
		multiple: boolean;
		/** The picked ids as they are now, in order. */
		getPicked: () => string[];
		pick: (id: string) => void;
		tr: Translate;
	}
	let { media, multiple, getPicked, pick, tr }: Props = $props();
	const popups = getPopupManager();
	const picked = $derived(getPicked());

	function choose(id: string) {
		pick(id);
		if (!multiple) popups.resolve('focus');
	}
	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			popups.resolve('focus');
		}
	}
	let root = $state<HTMLElement>();
	$effect(() => root?.focus());
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="light picker" role="dialog" aria-label={tr('Images')} tabindex="-1" {onkeydown} bind:this={root}>
	{#if media.length}
		<div class="grid">
			{#each media as m, n (m.id)}
				{@const at = picked.indexOf(m.id)}
				{#if m.group && m.group !== media[n - 1]?.group}<span class="group">{m.group}</span>{/if}
				<button type="button" class="thumb" class:on={at >= 0} title={m.name} aria-pressed={at >= 0} onclick={() => choose(m.id)}>
					<img src={m.url} alt={m.name} />
					{#if at >= 0}<span class="n">{multiple ? at + 1 : '✓'}</span>{/if}
				</button>
			{/each}
		</div>
		{#if multiple}
			<div class="foot">
				<span>{tr('{n} picked', { n: picked.length })}</span>
				<Button compact onclick={() => popups.resolve('focus')}>{tr('Done')}</Button>
			</div>
		{/if}
	{:else}
		<p class="none">{tr('No images attached to this page yet.')}</p>
	{/if}
</div>

<style>
	.picker {
		width: 360px;
		max-height: min(440px, calc(100vh - 24px));
		overflow: auto;
		padding: 10px;
		display: grid;
		gap: 10px;
		background: #fff;
		color: #1d1d1f;
		border: 1px solid #e5e5ea;
		border-radius: 12px;
		box-shadow: 0 10px 36px rgba(0, 0, 0, 0.2);
		font: 13px/1.4 system-ui, sans-serif;
		outline: none;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 4px;
	}
	.group {
		grid-column: 1 / -1;
		margin-top: 4px;
		color: #8e8e96;
		font-size: 11px;
	}
	.thumb {
		position: relative;
		padding: 0;
		border: 2px solid transparent;
		border-radius: 7px;
		background: none;
		cursor: pointer;
	}
	.thumb img {
		display: block;
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: 5px;
	}
	.thumb.on {
		border-color: var(--color-accent, #ea580c);
	}
	.n {
		position: absolute;
		top: 2px;
		right: 2px;
		min-width: 16px;
		height: 16px;
		padding: 0 3px;
		border-radius: 8px;
		background: var(--color-accent, #ea580c);
		color: #fff;
		font: 600 10px/16px system-ui, sans-serif;
	}
	.foot {
		position: sticky;
		bottom: -10px;
		margin: 0 -10px -10px;
		padding: 8px 10px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #fff;
		border-top: 1px solid #e5e5ea;
		color: #8e8e96;
	}
	.none {
		margin: 0;
		color: #8e8e96;
	}
</style>
