<!-- An inline plugin's element, edited in a popup: its fields, what it will look like, OK and Remove. Resolves with the
     new data, '' to remove the element, or undefined to leave it as it was. -->
<script lang="ts">
	import { Button, Input, Textarea, getPopupManager } from '@atom-forge/ui';
	import type { Translate } from '../i18n';
	import type { InlinePlugin } from '../types';

	let { plugin, data, fresh = false, tr }: { plugin: InlinePlugin<any>; data: Record<string, string>; fresh?: boolean; tr: Translate } = $props();
	const popups = getPopupManager();
	// svelte-ignore state_referenced_locally
	let values = $state<Record<string, string>>({ ...data });
	const shown = $derived(plugin.render(values));
	let first = $state<{ focus: () => void }>();
	$effect(() => first?.focus());

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement && !(e.metaKey || e.ctrlKey))) {
			e.preventDefault();
			popups.resolve({ ...values });
		} else if (e.key === 'Escape') {
			e.preventDefault();
			popups.resolve(undefined);
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="grid w-[360px] gap-2 rounded-xl border border-frame bg-surface p-2 shadow-[0_10px_36px_rgb(0_0_0/0.2)]" {onkeydown}>
	{#each plugin.fields as f, n (f.key)}
		<label class="grid gap-1">
			<span class="text-[11.5px] font-semibold text-muted-contrast">{tr(f.label)}</span>
			{#if f.kind === 'textarea'}
				<Textarea compact rows={3} placeholder={f.placeholder && tr(f.placeholder)} bind:value={() => values[f.key] ?? '', (v: string) => (values[f.key] = v)} />
			{:else if n === 0}
				<Input bind:this={first} compact monospace placeholder={f.placeholder && tr(f.placeholder)} bind:value={() => values[f.key] ?? '', (v: string) => (values[f.key] = v)} />
			{:else}
				<Input compact monospace placeholder={f.placeholder && tr(f.placeholder)} bind:value={() => values[f.key] ?? '', (v: string) => (values[f.key] = v)} />
			{/if}
		</label>
	{/each}
	{#if shown}
		<div class="overflow-x-auto rounded-md bg-muted px-2 py-1.5 text-center">{@html shown}</div>
	{/if}
	<div class="flex justify-end gap-1.5">
		{#if !fresh}<Button compact ghost label={tr('Remove')} onclick={() => popups.resolve('')} />{/if}
		<Button compact accent label={tr('OK')} onclick={() => popups.resolve({ ...values })} />
	</div>
</div>
