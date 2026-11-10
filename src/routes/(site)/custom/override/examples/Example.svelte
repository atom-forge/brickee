<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { siteMap } from '$site/blocks/siteMap';

	const plugins = [siteMap];
	let value = $state<StoredBlock[]>([
		{ type: 'map', indent: 0, props: { q: 'Budapest, Parliament', zoom: '15', caption: 'Meet us at the main entrance.' } }
	]);
</script>

<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value {plugins} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} {plugins} />
	</article>
</div>
