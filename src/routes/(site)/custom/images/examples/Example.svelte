<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { photo } from '$site/blocks/photo';

	const plugins = [photo];
	let value = $state<StoredBlock[]>([
		{ type: 'photo', indent: 0, props: { image: 'ocean', alt: 'A blue gradient', ratio: '40' } },
		{ type: 'md:p', indent: 0, text: 'Pick another image under the photo, or open its fields to change the alt text and the height.' }
	]);
</script>

<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value {plugins} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} {plugins} />
	</article>
</div>
