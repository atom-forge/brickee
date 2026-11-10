<script lang="ts">
	import { Icon } from '@atom-forge/ui';
	import { ChevronRight } from '@lucide/svelte';
	import type { MenuItem } from './nav-types';

	let { items, mobile = false, onNavigate }: {
		items: MenuItem[];
		mobile?: boolean;
		onNavigate?: () => void;
	} = $props();

	const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');
</script>

{#snippet tree(entries: MenuItem[])}
	<ul class="space-y-0.5">
		{#each entries.filter(entry => entry.type || entry.only !== (mobile ? 'desktop' : 'mobile')) as item}
			{#if item.type === 'separator'}
				<li aria-hidden="true"><hr class="my-2 border-frame" /></li>
			{:else if item.type === 'heading'}
				<li class="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-contrast/60">{item.label}</li>
			{:else if item.children?.length}
				<li>
					<details open={item.active} class="nav-group">
						<summary class={cx('flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-xs font-semibold hover:bg-secondary', mobile ? 'py-3 text-sm' : 'py-2', item.active ? 'text-accent' : 'text-muted-contrast')}>
							{#if item.icon}<Icon icon={item.icon} size="4" />{/if}
							<span class="flex-1">{item.label}</span>
							<ChevronRight size={14} class="nav-chevron shrink-0 transition-transform" />
						</summary>
						<div class="ml-3 border-l border-frame pl-2 pb-1">
							{@render tree(item.children)}
						</div>
					</details>
				</li>
			{:else}
				<li>
					{#if item.href}
						<a href={item.href} aria-current={item.active ? 'page' : undefined}
							onclick={onNavigate}
							class={cx('flex w-full items-center gap-2 rounded-lg px-2 text-sm no-underline transition-colors', mobile ? 'py-3' : 'py-1.5', item.active ? 'bg-accent/10 text-accent' : 'text-muted-contrast hover:bg-secondary')}>
							{#if item.icon}<Icon icon={item.icon} size="4" />{/if}
							{item.label}
						</a>
					{:else}
						<button class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-contrast hover:bg-secondary" onclick={() => { item.onclick?.(); onNavigate?.(); }}>
							{#if item.icon}<Icon icon={item.icon} size="4" />{/if}{item.label}
						</button>
					{/if}
				</li>
			{/if}
		{/each}
	</ul>
{/snippet}

{@render tree(items)}

<style>
	summary::-webkit-details-marker { display: none; }
	.nav-group[open] > summary :global(.nav-chevron) { transform: rotate(90deg); }
</style>
