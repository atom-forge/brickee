<!-- The link field of the formatting toolbar (Ctrl+K), in an atom-forge popup: resolves with the address, '' to remove the link. -->
<script lang="ts">
	import { Button, Input, getPopupManager } from '@atom-forge/ui';
	import type { Translate } from './i18n';

	let { href = '', tr }: { href?: string; tr: Translate } = $props();
	const popups = getPopupManager();
	// svelte-ignore state_referenced_locally
	let url = $state(href);
	let input = $state<{ focus: () => void }>();
	$effect(() => input?.focus());

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			popups.resolve(url.trim());
		} else if (e.key === 'Escape') {
			e.preventDefault();
			popups.resolve(undefined);
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="link" {onkeydown}>
	<Input bind:this={input} compact monospace bind:value={url} placeholder="https://…" />
	<Button compact accent label={tr('OK')} onclick={() => popups.resolve(url.trim())} />
	{#if href}<Button compact ghost label={tr('Remove')} onclick={() => popups.resolve('')} />{/if}
</div>

<style>
	.link {
		display: flex;
		gap: 6px;
		width: 340px;
		padding: 8px;
		background: var(--color-surface, #fff);
		border: 1px solid var(--color-frame, #e5e5ea);
		border-radius: 12px;
		box-shadow: 0 10px 36px rgba(0, 0, 0, 0.2);
	}
</style>
