<script lang="ts">
	import { Switch } from '@atom-forge/ui';
	import { Editor, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { welcome } from '$site/samples';

	let value = $state<StoredBlock[]>(welcome());
	let readonly = $state(true);
</script>

<div class="space-y-4">
	<Switch bind:value={readonly} label="Read-only" />
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value plugins={PLUGINS} {readonly} /></div>
</div>
