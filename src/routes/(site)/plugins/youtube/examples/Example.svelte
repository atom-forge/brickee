<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { youtube } from '@atom-forge/brickee/plugins';

	const plugins = [youtube];
	let value = $state<StoredBlock[]>([
		{ type: 'md:p', indent: 0, text: 'Paste a video link or id into the field; the preview loads the player on click.' },
		{ type: 'youtube', indent: 0, props: { id: 'jNQXAC9IVRw', title: 'Me at the zoo' } }
	]);
</script>

<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value {plugins} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} {plugins} />
	</article>
</div>
