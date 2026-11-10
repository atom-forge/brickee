<svelte:options css="injected" />

<script lang="ts">
	import type { PluginPreviewProps } from '../types';
	import { gapLines, type GapProps } from './Gap.svelte';

	let { props }: PluginPreviewProps<GapProps> = $props();
</script>

<div class="gap" style:height="{gapLines(props.lines)}lh" aria-hidden="true"></div>

<style>
	.gap {
		clear: both;
		margin: 0;
	}
</style>
