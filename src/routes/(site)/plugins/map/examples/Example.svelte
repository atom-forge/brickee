<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { map } from '@atom-forge/brickee/plugins';

	const plugins = [map];
	let value = $state<StoredBlock[]>([{ type: 'map', indent: 0, props: { q: 'Pécs, Széchenyi tér', zoom: '16' } }]);
</script>

<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value {plugins} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} {plugins} />
	</article>
</div>
