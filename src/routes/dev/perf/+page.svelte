<script lang="ts">
	// Development page (not linked from the site): a large document for measuring the editor while typing.
	// ?n=… blocks (default 500), ?nopreview, ?readonly, ?raw (the host keeps the document in $state.raw instead of $state).
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';

	const n = Number(page.url.searchParams.get('n') ?? 500);
	const raw = page.url.searchParams.has('raw');
	const preview = !page.url.searchParams.has('nopreview');
	const readonly = page.url.searchParams.has('readonly');
	// How often the editor wrote the document back (?readonly: should stay 0).
	let writes = $state(-1);
	const doc = () =>
		Array.from({ length: n }, (_, i): StoredBlock =>
			i % 25 === 12
				? { type: 'table', indent: 0, props: { rows: [['a', 'b'], ['1', '2']], heads: ['top'] } }
				: { type: i % 5 ? 'md:p' : 'md:ul', indent: 0, text: `Block ${i}: some **bold**, *italic* and a [link](https://x.y/${i}) in a sentence of ordinary length.` }
		);
	let deep = $state<StoredBlock[]>(raw ? [] : doc());
	let flat = $state.raw<StoredBlock[]>(raw ? doc() : []);
	// ?raw: is the host's array still the one it passed in (no write back)?
	const initial = flat;
	$effect(() => {
		void flat;
		void deep;
		untrack(() => writes++);
	});
</script>

<p data-writes={writes} data-same={flat === initial}>writes: {writes}, same array: {flat === initial}</p>
<div class="grid grid-cols-2 gap-4">
	{#if raw}
		<div class="pl-6"><Editor bind:value={flat} plugins={PLUGINS} {readonly} /></div>
		{#if preview}<div class="prose"><Preview blocks={flat} plugins={PLUGINS} /></div>{/if}
	{:else}
		<div class="pl-6"><Editor bind:value={deep} plugins={PLUGINS} {readonly} /></div>
		{#if preview}<div class="prose"><Preview blocks={deep} plugins={PLUGINS} /></div>{/if}
	{/if}
</div>
