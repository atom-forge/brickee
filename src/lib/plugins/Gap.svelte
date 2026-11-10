<script lang="ts" module>
	export interface GapProps extends Record<string, unknown> {
		/** The height in lines of text (of the text around it), as a string from the select. */
		lines: string;
	}

	export const GAP_MAX = 8;
	export const GAP_LINES = Array.from({ length: GAP_MAX }, (_, i) => ({ value: String(i + 1), label: i ? '{n} lines' : '1 line' }));

	/** The number of lines, 1–8 (default 1). */
	export const gapLines = (lines: unknown) => Math.min(GAP_MAX, Math.max(1, Math.round(Number(lines)) || 1));
</script>

<script lang="ts">
	import type { PluginViewProps } from '../types';

	// Empty space, so many lines high; in the editor a hatched strip of the same height.
	let { props = $bindable() }: PluginViewProps<GapProps> = $props();
</script>

<div class="gap" style:height="{gapLines(props.lines)}lh" aria-hidden="true"></div>

<style>
	.gap {
		border-radius: 6px;
		background: repeating-linear-gradient(-45deg, transparent 0 6px, color-mix(in srgb, currentColor 7%, transparent) 6px 12px);
	}
</style>
