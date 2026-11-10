<script lang="ts">
	import { browser } from '$app/environment';
	import { Editor, fromStored, toMarkdown, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { welcome } from '$site/samples';

	let value = $state<StoredBlock[]>(welcome());
	// toMarkdown uses the DOM: call it in the browser only. Plugins without a markdown form are left out.
	const markdown = $derived(browser ? toMarkdown(value.map(fromStored), { plugins: PLUGINS }) : '');
</script>

<div class="grid gap-4 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value plugins={PLUGINS} /></div>
	<pre class="whitespace-pre-wrap rounded-lg bg-secondary p-3 font-mono text-xs">{markdown}</pre>
</div>
