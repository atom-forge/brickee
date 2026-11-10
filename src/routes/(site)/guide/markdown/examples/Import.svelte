<script lang="ts">
	import { Button } from '@atom-forge/ui';
	import { Editor, fromMarkdown, toStored, type StoredBlock } from '@atom-forge/brickee';

	let text = $state('# Imported\n\nSome **bold** and *italic* text with a [link](https://atom-forge.eu).\n\n- one\n- two\n  - nested\n\n- [x] done\n- [ ] to do\n\n> A quote\n\n```ts\nconst answer = 42;\n```');
	let value = $state<StoredBlock[]>([]);

	// fromMarkdown makes the editor's blocks; toStored turns them into the stored form (browser only).
	const load = () => (value = fromMarkdown(text).map(toStored));
</script>

<div class="grid gap-4 md:grid-cols-2">
	<div class="space-y-2">
		<textarea bind:value={text} rows="14" class="w-full rounded-lg border border-frame bg-surface p-3 font-mono text-xs"></textarea>
		<Button onclick={load}>Import →</Button>
	</div>
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value /></div>
</div>
