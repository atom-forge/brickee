<!-- One plugin block in the editor: its view, and its fields (PropsBar). A plugin drawn in a Frame gets the fields inside
     the frame, on its top (the Frame claims them through the context); any other gets them above its view. A container
     gets the host's palette narrowed to its `accepts`. -->
<script lang="ts" module>
	import { getContext, setContext, type Snippet } from 'svelte';

	const KEY = Symbol('block-fields');
	type Host = { fields: Snippet | undefined; claimed: boolean };

	/** For a frame: takes the block's fields to draw them itself; undefined when there are none (or read-only). */
	export function claimFields(): Snippet | undefined {
		const host = getContext<Host | undefined>(KEY);
		if (!host) return undefined;
		host.claimed = true;
		return host.fields;
	}
</script>

<script lang="ts">
	import { narrowPalette } from './palette';
	import type { BlockPlugin, PluginViewProps } from './types';

	interface Props extends Omit<PluginViewProps, 'props' | 'blocks'> {
		plugin: BlockPlugin;
		props: PluginViewProps['props'];
		blocks: PluginViewProps['blocks'];
		fields?: Snippet;
	}
	let { plugin, props = $bindable(), blocks = $bindable(), readonly, palette, plugins, fields }: Props = $props();

	// svelte-ignore state_referenced_locally
	const host = $state<Host>({ fields, claimed: false });
	setContext(KEY, host);
	$effect.pre(() => {
		host.fields = fields;
	});
</script>

{#if fields && !host.claimed}{@render fields()}{/if}
<!-- a container's nested editor offers only the blocks it accepts -->
<plugin.view bind:props bind:blocks {readonly} palette={narrowPalette(palette, plugin.accepts)} {plugins} />
