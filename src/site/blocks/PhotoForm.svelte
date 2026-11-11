<script lang="ts">
	// The photo block's own form in its fields bar (BlockPlugin.form): any component, with the block's props bound.
	// Here a picker of the album the app's context names, and an upload button with its own script.
	import { Upload } from '@lucide/svelte';
	import type { PluginFormProps } from '@atom-forge/brickee';
	import { IMAGES, addImage, useAlbum } from './images.svelte';
	import type { PhotoProps } from './PhotoView.svelte';

	let { props = $bindable() }: PluginFormProps<PhotoProps> = $props();
	const album = useAlbum();
	const shown = $derived(IMAGES.filter((m) => m.album === album() || m.id === props.image));

	// Assign a new object: that is one edit of the block (one undo step).
	const pick = (image: string) => (props = { ...props, image });
	let input: HTMLInputElement;
	function upload() {
		const file = input.files?.[0];
		if (file) pick(addImage(file, album()));
		input.value = '';
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	{#each shown as m (m.id)}
		<button
			type="button"
			title={m.name}
			class="h-10 w-16 overflow-hidden rounded border-2 {m.id === props.image ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100'}"
			onclick={() => pick(m.id)}
		>
			<img src={m.url} alt={m.name} class="h-full w-full object-cover" />
		</button>
	{/each}
	<button type="button" title="Upload" class="grid h-10 w-16 place-items-center rounded border border-dashed border-frame text-muted-contrast hover:text-surface-contrast" onclick={() => input.click()}>
		<Upload size={16} />
	</button>
	<input bind:this={input} type="file" accept="image/*" class="hidden" onchange={upload} />
</div>
