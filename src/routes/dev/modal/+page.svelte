<script lang="ts">
	// Development page (not linked from the site): the editor inside an @atom-forge/ui modal and drawer, for checking
	// that the floating menus (formatting bar, slash and turn-into menus, link field) appear above the overlay and that
	// Escape on them does not close it.
	import { Button, getDrawerManager, getModalManager } from '@atom-forge/ui';
	import type { StoredBlock } from '@atom-forge/brickee';
	import Body from './Body.svelte';

	const modal = getModalManager();
	const drawer = getDrawerManager();
	const doc = $state<{ value: StoredBlock[] }>({
		value: [
			{ type: 'md:h2', indent: 0, text: 'In a window' },
			{ type: 'md:p', indent: 0, text: 'Select some text for the formatting bar, or type / on an empty line.' },
			{ type: 'md:p', indent: 0, text: '' }
		]
	});
	let closed = $state(0);

	async function open(kind: 'modal' | 'drawer') {
		if (kind === 'modal') await modal.open(Body, { doc });
		else await drawer.open(Body, { doc }, { position: 'right' });
		closed++;
	}
</script>

<div class="flex gap-2 p-6">
	<Button label="Open modal" onclick={() => open('modal')} />
	<Button label="Open drawer" onclick={() => open('drawer')} />
	<span>closed: <span data-testid="closed">{closed}</span></span>
</div>
