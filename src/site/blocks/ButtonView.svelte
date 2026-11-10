<script lang="ts" module>
	export interface ButtonProps extends Record<string, unknown> {
		label: string;
		url: string;
		color: string;
	}
</script>

<script lang="ts">
	import { MousePointerClick } from '@lucide/svelte';
	import { Empty, safeColor, type PluginViewProps } from '@atom-forge/brickee';

	// Both bindable, even if unused.
	let { props = $bindable(), blocks = $bindable() }: PluginViewProps<ButtonProps> = $props();
</script>

{#if props.label}
	<span class="inline-block rounded-md px-4 py-2 text-sm font-semibold text-white" style:background={safeColor(props.color, '#2563eb')}>{props.label}</span>
{:else}
	<Empty icon={MousePointerClick} text="Set the label and the link above" />
{/if}
