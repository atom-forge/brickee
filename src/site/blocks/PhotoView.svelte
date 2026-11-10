<script lang="ts" module>
	export interface PhotoProps extends Record<string, unknown> {
		/** An id from this app's image library: the app's choice (it could store a URL just as well). */
		image: string;
		alt: string;
		/** The height in % of the width (20–150), or unset for the image's own shape; may be per view. */
		ratio?: unknown;
	}

	/** A CSS aspect-ratio from a stored height, or undefined. */
	export const aspect = (v: unknown) => {
		const n = Number(v);
		return n >= 20 && n <= 150 ? `100 / ${n}` : undefined;
	};
</script>

<script lang="ts">
	import { baseValue, useView, viewValues, type PluginViewProps } from '@atom-forge/brickee';
	import { IMAGES, findImage } from './images';
	import { VIEW_KEYS } from './views';

	let { props = $bindable(), blocks = $bindable(), readonly }: PluginViewProps<PhotoProps> = $props();
	const view = useView();
	const item = $derived(findImage(props.image));
	// In the editor, show the ratio of the view being edited.
	const ratio = $derived.by(() => {
		const i = VIEW_KEYS.indexOf(view() ?? '');
		return i < 0 ? baseValue(props.ratio) : viewValues(props.ratio, VIEW_KEYS)[i];
	});
</script>

{#if item}
	<img src={item.url} alt={props.alt} class="w-full rounded-md object-cover" style:aspect-ratio={aspect(ratio)} />
{/if}
{#if !readonly}
	<!-- The app's own picker: here a row of its library's thumbnails. -->
	<div class="mt-2 flex flex-wrap gap-2">
		{#each IMAGES as m (m.id)}
			<button
				type="button"
				title={m.name}
				class="h-10 w-16 overflow-hidden rounded border-2 {m.id === props.image ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100'}"
				onclick={() => (props = { ...props, image: m.id })}
			>
				<img src={m.url} alt={m.name} class="h-full w-full object-cover" />
			</button>
		{/each}
	</div>
{/if}
