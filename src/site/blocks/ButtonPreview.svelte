<script lang="ts">
	import { safeColor, type PluginPreviewProps } from '@atom-forge/brickee';
	import type { ButtonProps } from './ButtonView.svelte';

	let { props }: PluginPreviewProps<ButtonProps> = $props();
	// Props are user input: only http(s), mailto and site-relative links.
	const href = $derived(/^(https?:|mailto:|\/(?!\/))/.test(String(props.url ?? '')) ? String(props.url) : '');
</script>

{#if href && props.label}
	<p>
		<a {href} class="inline-block rounded-md px-4 py-2 font-semibold text-white no-underline" style:background={safeColor(props.color, '#2563eb')}>{props.label}</a>
	</p>
{/if}
