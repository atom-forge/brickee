<script lang="ts">
	import { Editor, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';

	// Every plugin stays known (stored documents may use them), but the editor offers only these blocks.
	const palette = ['md:p', 'md:h2', 'md:ul', 'table'];
	let value = $state<StoredBlock[]>([{ type: 'md:p', indent: 0, text: 'Press `/` on an empty line: only paragraphs, subheadings, bullets and tables are offered.' }]);
</script>

<!-- pl-6: room for the block handles, drawn left of the editor -->
<div class="pl-6"><Editor bind:value plugins={PLUGINS} {palette} /></div>
