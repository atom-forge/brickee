<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { welcome } from '$site/samples';

	let value = $state<StoredBlock[]>(welcome());
</script>

<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value plugins={PLUGINS} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} plugins={PLUGINS} />
	</article>
</div>
