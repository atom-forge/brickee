<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { photo } from '$site/blocks/photo';
	import { provideAlbum } from '$site/blocks/images.svelte';

	const plugins = [photo];
	// The app's own context: the album the photo form offers. Brickee only passes the props through.
	let album = $state('cool');
	provideAlbum(() => album);

	let value = $state<StoredBlock[]>([
		{ type: 'photo', indent: 0, props: { image: 'ocean', alt: 'A blue gradient', ratio: '40' } },
		{ type: 'md:p', indent: 0, text: 'Open the photo’s fields: the picker below them is the plugin’s own form.' }
	]);
</script>

<div class="mb-4 flex items-center gap-2 text-sm">
	<span class="text-muted-contrast">Album (the app’s context):</span>
	{#each ['cool', 'warm', 'uploads'] as a (a)}
		<button type="button" class="rounded-md border px-2 py-0.5 {album === a ? 'border-accent text-accent' : 'border-frame'}" onclick={() => (album = a)}>{a}</button>
	{/each}
</div>
<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value {plugins} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} {plugins} />
	</article>
</div>
