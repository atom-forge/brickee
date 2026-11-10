<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { gap } from '@atom-forge/brickee/plugins';

	const plugins = [gap];
	let value = $state<StoredBlock[]>([
		{ type: 'md:p', indent: 0, text: 'Text above the gap.' },
		{ type: 'gap', indent: 0, props: { lines: '3' } },
		{ type: 'md:p', indent: 0, text: 'Text below it. Drag the slider to change the height.' }
	]);
</script>

<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value {plugins} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} {plugins} />
	</article>
</div>
