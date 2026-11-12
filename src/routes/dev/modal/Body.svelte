<!-- The overlay's content: the editor on the page's document (a shared $state object, so edits survive reopening). -->
<script lang="ts">
	import { Card } from '@atom-forge/ui';
	import { Editor, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';

	let { doc }: { doc: { value: StoredBlock[] } } = $props();
</script>

<Card class="w-[640px] max-w-full p-6" data-testid="overlay">
	<Editor bind:value={doc.value} plugins={PLUGINS} />
</Card>
