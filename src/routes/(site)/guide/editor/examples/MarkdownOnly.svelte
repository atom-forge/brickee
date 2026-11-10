<script lang="ts">
	import { Editor, blocksToPlainText, type StoredBlock } from '@atom-forge/brickee';

	// No plugins: a plain markdown block editor. An empty document is one empty paragraph.
	let value = $state<StoredBlock[]>([]);
	const empty = $derived(blocksToPlainText(value).trim() === '');
</script>

<div class="space-y-4">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value placeholder="Start writing, or press '/' for blocks…" /></div>
	<p class="text-xs text-muted-contrast">{empty ? 'The document is empty.' : `${value.length} block(s)`}</p>
</div>
