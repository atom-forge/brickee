<script lang="ts">
	import { Card } from '@atom-forge/ui';
	import NavTree from './NavTree.svelte';
	import type { MenuItem } from './nav-types';

	let { items }: { items: MenuItem[] } = $props();
</script>

<Card class="py-0 w-64 hidden lg:flex flex-col my-4 min-h-0 shrink-0 sticky self-start top-[calc(var(--app-header-h,0px)+1rem)] max-h-[calc(100dvh-var(--app-header-h,0px)-2rem)]" elevate="0">
	<nav aria-label="Site navigation" class="flex-1 min-h-0 overflow-y-auto px-2 py-2">
		<NavTree {items} />
	</nav>
</Card>
