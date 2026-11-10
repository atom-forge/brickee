<script lang="ts">
	import { Atom, Button, defineIcon, getDrawerManager } from '@atom-forge/ui';
	import { X } from '@lucide/svelte';
	import ThemeSwitch from './ThemeSwitch.svelte';
	import NavTree from './NavTree.svelte';
	import type { MenuItem } from './nav-types';

	let { items }: { items: MenuItem[] } = $props();
	const drawerManager = getDrawerManager();
	import { uiIcon } from './icon';
</script>

<div class="flex flex-col h-full min-h-0 overflow-hidden">
	<div class="flex items-center gap-3 pl-7 pr-4 h-16 border-b border-frame shrink-0 bg-canvas">
		<Atom />
		<span class="text-2xl flex">
			<span class="font-extralight text-canvas-contrast">Atom</span>
			<span class="font-extrabold text-accent">Forge</span>
			<span class="ml-2 font-light text-muted-contrast">Brickee</span>
		</span>
		<Button icon={defineIcon(uiIcon(X))} ghost compact class="ml-auto" onclick={() => drawerManager.close()} />
	</div>
	<nav aria-label="Site navigation" class="flex-1 min-h-0 overflow-y-auto p-3">
		<NavTree {items} mobile onNavigate={() => drawerManager.close()} />
	</nav>
	<div class="border-t border-frame px-4 py-3 flex items-center justify-end bg-canvas shrink-0">
		<ThemeSwitch />
	</div>
</div>
