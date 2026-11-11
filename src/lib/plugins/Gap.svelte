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

<div
	class="rounded-md bg-[repeating-linear-gradient(-45deg,transparent_0_6px,color-mix(in_srgb,currentColor_7%,transparent)_6px_12px)]"
	style:height="{gapLines(props.lines)}lh"
	aria-hidden="true"
></div>
