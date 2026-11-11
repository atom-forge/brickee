<!-- The formatting bar above a text selection: bold, italic… link, plain text. -->
<script lang="ts">
	import type { Icon } from '../palette';

	let {
		x,
		y,
		tools,
		label,
		onpick
	}: {
		/** The middle of the selection's top edge; the bar sits centred above it. */
		x: number;
		y: number;
		tools: { cmd: string; icon: Icon; title: string }[];
		label: string;
		onpick: (cmd: string) => void;
	} = $props();
</script>

<div
	class="fixed z-20 flex -translate-x-1/2 translate-y-[calc(-100%-8px)] gap-0.5 rounded-[10px] border border-frame bg-surface p-1 shadow-[0_6px_24px_rgb(0_0_0/0.18)]"
	style:left="{x}px"
	style:top="{y}px"
	role="toolbar"
	aria-label={label}
>
	{#each tools as t (t.cmd)}
		<button
			type="button"
			class="grid h-[30px] min-w-[30px] cursor-pointer place-items-center rounded-md border-0 bg-transparent text-surface-contrast hover:bg-[rgb(120_120_140/0.14)]"
			title={t.title}
			aria-label={t.title}
			onmousedown={(e) => e.preventDefault()}
			onclick={() => onpick(t.cmd)}><t.icon size={16} /></button
		>
	{/each}
</div>
