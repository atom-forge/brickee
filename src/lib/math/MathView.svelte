<script lang="ts" module>
	export interface MathProps extends Record<string, unknown> {
		/** The formula in LaTeX. */
		tex: string;
	}
</script>

<script lang="ts">
	import { Sigma } from '@lucide/svelte';
	import Empty from '../kit/Empty.svelte';
	import type { PluginViewProps } from '../types';
	import { tex } from './tex';

	let { props = $bindable(), blocks = $bindable() }: PluginViewProps<MathProps> = $props();
	const html = $derived(String(props.tex ?? '').trim() ? tex(String(props.tex), true) : '');
</script>

{#if html}
	<div class="overflow-x-auto py-1 text-center">{@html html}</div>
{:else}
	<Empty icon={Sigma} text="Write the formula above, in LaTeX" />
{/if}
