<!-- A block menu of the editor: the slash menu (block types to insert) and the turn-into menu (what the selected
     blocks can become). Compact one-line rows: icon, label, and the hint after it in grey. The editor keeps the state
     (which row is active, where the menu is) and handles the keys. -->
<script lang="ts" module>
	import type { Icon } from '../palette';

	export interface MenuRow {
		key: string;
		icon: Icon;
		label: string;
		hint: string;
		/** The hint as a warning (e.g. "Loses formatting"). */
		warn?: boolean;
		/** A destructive row (delete), in red. */
		danger?: boolean;
		/** The current type of the selection: a check mark. */
		current?: boolean;
		/** A separator line above this row. */
		gap?: boolean;
	}
</script>

<script lang="ts">
	import { Check } from '@lucide/svelte';
	import { portal } from '../dom';

	let {
		rows,
		index,
		x,
		y,
		up,
		turn = false,
		caption,
		label,
		onpick,
		onhover
	}: {
		rows: MenuRow[];
		index: number;
		x: number;
		y: number;
		/** Opens upwards from `y` (no room below). */
		up: boolean;
		/** The turn-into menu: a little narrower and taller. */
		turn?: boolean;
		caption?: string;
		label: string;
		onpick: (n: number) => void;
		onhover: (n: number) => void;
	} = $props();

	let menu: HTMLDivElement;
	// Keep the highlighted row visible while moving through the menu with the arrow keys.
	$effect(() => {
		void index;
		menu?.querySelector('.active')?.scrollIntoView({ block: 'nearest' });
	});
</script>

<!-- `menu`, `turn` and `active` are hooks (closing on an outside click, scrolling the active row into view), not styles.
     It lives in the body (portal), so it keeps the editor's type size and colour itself. -->
<div
	bind:this={menu}
	use:portal
	class="menu fixed z-30 overflow-auto text-[17px] leading-[1.65] text-surface-contrast rounded-xl border border-frame bg-surface p-1.5 shadow-[0_10px_36px_rgb(0_0_0/0.2)] {turn
		? 'turn max-h-[340px] w-60'
		: 'max-h-[300px] w-[260px]'} {up ? '-translate-y-full' : ''}"
	style:left="{x}px"
	style:top="{y}px"
	role="listbox"
	aria-label={label}
>
	{#if caption}
		<div class="px-2 pt-1 pb-1.5 font-[system-ui] text-[11px] leading-[normal] font-semibold tracking-[0.06em] text-muted-contrast uppercase">{caption}</div>
	{/if}
	{#each rows as row, n (row.key)}
		{#if row.gap}<div class="mx-1 my-1.5 h-px bg-frame"></div>{/if}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="item flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-[3px] {n === index ? 'active bg-accent/14' : ''} {row.danger ? 'text-[#dc2626]' : ''}"
			role="option"
			tabindex="-1"
			aria-selected={n === index}
			onmousedown={(e) => {
				e.preventDefault();
				onpick(n);
			}}
			onmouseenter={() => onhover(n)}
		>
			<span class="grid size-6 flex-none place-items-center rounded-md border border-frame {row.danger ? 'text-[#dc2626]' : 'text-surface-contrast'}"
				><row.icon size={14} /></span
			>
			<span class="flex min-w-0 items-baseline gap-1.5 overflow-hidden whitespace-nowrap"
				><b class="font-[system-ui] text-[13px] leading-[normal] font-medium">{row.label}</b><small
					class="overflow-hidden text-[11px] text-ellipsis {row.warn ? 'text-[#b45309]' : 'text-muted-contrast'}">{row.hint}</small
				></span
			>
			{#if row.current}<span class="ml-auto flex text-accent"><Check size={16} /></span>{/if}
		</div>
	{/each}
</div>
