<script lang="ts">
	import { mapSrc, type MapProps } from '@atom-forge/brickee/plugins';
	import type { PluginPreviewProps } from '@atom-forge/brickee';

	// The site's own map: rounded, with a caption (a field this site added to the bundled plugin).
	let { props }: PluginPreviewProps<MapProps & { caption?: string }> = $props();
	const src = $derived(mapSrc(props));
</script>

{#if src}
	<figure class="my-4 overflow-hidden rounded-xl border border-frame">
		<iframe {src} title={props.q} class="h-64 w-full" loading="lazy"></iframe>
		{#if props.caption}<figcaption class="px-3 py-2 text-sm text-muted-contrast">{props.caption}</figcaption>{/if}
	</figure>
{/if}
