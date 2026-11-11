<svelte:options css="injected" />

<script lang="ts">
	import type { PluginPreviewProps } from '../types';
	import type { MathProps } from './MathView.svelte';
	import { tex } from './tex';

	let { props }: PluginPreviewProps<MathProps> = $props();
	const html = $derived(String(props.tex ?? '').trim() ? tex(String(props.tex), true) : '');
</script>

{#if html}
	<div class="math">{@html html}</div>
{/if}

<style lang="scss">
	// Wide formulas scroll on their own instead of the page.
	.math {
		margin: 0 0 1em;
		overflow-x: auto;
		text-align: center;
	}
</style>
