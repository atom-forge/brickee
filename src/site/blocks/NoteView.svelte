<script lang="ts" module>
	export interface NoteProps extends Record<string, unknown> {
		title: string;
	}
</script>

<script lang="ts">
	import { Frame, useText, type PluginViewProps } from '@atom-forge/brickee';

	let { props = $bindable(), blocks = $bindable(), readonly, palette, plugins }: PluginViewProps<NoteProps> = $props();
	const tr = useText();
</script>

<Frame bind:blocks {readonly} {palette} {plugins} heading={props.title} empty={tr('Note')} placeholder={tr('Write the note…')} />
