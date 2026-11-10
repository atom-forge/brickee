<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { button } from '$site/blocks/button';

	const plugins = [button];
	let value = $state<StoredBlock[]>([
		{ type: 'md:p', indent: 0, text: 'Select the button block to edit its fields: label, link and colour.' },
		{ type: 'button', indent: 0, props: { label: 'Get started', url: 'https://github.com/atom-forge/brickee', color: '#ea580c' } }
	]);
</script>

<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value {plugins} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} {plugins} />
	</article>
</div>
