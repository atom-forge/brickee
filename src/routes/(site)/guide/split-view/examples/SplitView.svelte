<script lang="ts">
	import { Switch } from '@atom-forge/ui';
	import { Editor, Preview, scrollSync, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { longRead } from '$site/samples';

	let value = $state<StoredBlock[]>(longRead());
	let on = $state(true);
	const sync = scrollSync();
</script>

<div class="space-y-4">
	<Switch bind:value={on} label="Follow the editor" />
	<div class="grid grid-cols-2 gap-4">
		<!-- The actions go on the boxes that scroll. -->
		<div class="h-96 overflow-y-auto rounded-lg border border-frame p-3" use:sync.source>
			<!-- pl-6: room for the block handles, drawn left of the editor -->
			<div class="pl-6"><Editor bind:value plugins={PLUGINS} /></div>
		</div>
		<div class="h-96 overflow-y-auto rounded-lg border border-frame p-3" use:sync.target={on}>
			<div class="prose prose-sm prose-stone max-w-none dark:prose-invert">
				<Preview blocks={value} plugins={PLUGINS} />
			</div>
		</div>
	</div>
</div>
