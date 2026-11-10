<script lang="ts">
	import { Editor, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';

	let value = $state<StoredBlock[]>([
		{ type: 'md:h3', indent: 0, text: 'Opening hours' },
		{ type: 'md:ul', indent: 0, text: 'Monday to Friday: **9–17**' },
		{ type: 'md:ul', indent: 1, text: 'lunch break 12–13' },
		{ type: 'gap', indent: 0, props: { lines: '1' } }
	]);
</script>

<div class="grid gap-4 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value plugins={PLUGINS} /></div>
	<pre class="max-h-96 overflow-auto rounded-lg bg-secondary p-3 font-mono text-xs">{JSON.stringify(value, null, 2)}</pre>
</div>
