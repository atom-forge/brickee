<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { youtube } from '@atom-forge/brickee/plugins';
	import { note } from '$site/blocks/note';

	const plugins = [note, youtube];
	let value = $state<StoredBlock[]>([
		{
			type: 'note',
			indent: 0,
			props: { title: 'Good to know' },
			blocks: [
				{ type: 'md:p', indent: 0, text: 'A note holds its own little document. Press `/` inside it: only paragraphs, lists and videos are offered.' },
				{ type: 'md:ul', indent: 0, text: 'One level of nesting only' }
			]
		}
	]);
</script>

<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value {plugins} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} {plugins} />
	</article>
</div>
