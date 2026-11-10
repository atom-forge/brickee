# Host contexts

[← Previous](writing-plugins.md) · [Contents](index.md) · [Next →](server-side.md)

The editor has no props for application concepts. What a host knows — its images, the page width it is showing, its language — reaches the plugins through three Svelte contexts. Each has a `provide…` function, called in a component's initialization above the editor or preview, and a `use…` function for plugin components.

| Context | Provide | Read | Carries |
|---|---|---|---|
| Media | `media` prop, or `provideMedia(() => list)` | `useMedia()` | The images blocks can pick from. |
| View | `provideView(() => key)` | `useView()` | The view per-view fields edit. |
| Text | `messages` prop, or `provideText(() => messages)` | `useText()` | UI text in the host's language. |

Nested editors and previews inherit all three from their parent.

## Media

Blocks never store image URLs. An image field stores the **id** of a `MediaItem`, and the editor, the preview and the plugins look the item up in the document's media:

```ts
interface MediaItem {
	id: string; // stored in the block's props
	name: string; // file name or title, shown in the picker
	url: string; // the image's address
	group?: string; // a heading in the picker (e.g. the attachment category)
}
```

The bundled plugins use no images; image blocks are yours to write, because their layout is the site's. A minimal `photo` plugin — an image field, alt text, and a height slider:

```svelte
<!-- PhotoView.svelte -->
<script lang="ts" module>
	export interface PhotoProps extends Record<string, unknown> {
		/** A MediaItem id. */
		image: string;
		alt: string;
		/** The height in % of the width (20–150), or unset for the image's own shape. */
		ratio?: unknown;
	}

	/** A CSS aspect-ratio from a stored height, or undefined. */
	export const aspect = (v: unknown) => {
		const n = Number(v);
		return n >= 20 && n <= 150 ? `100 / ${n}` : undefined;
	};
</script>

<script lang="ts">
	import { ImageIcon } from '@lucide/svelte';
	import { Empty, findMedia, useMedia, type PluginViewProps } from '@atom-forge/brickee';

	let { props = $bindable(), blocks = $bindable() }: PluginViewProps<PhotoProps> = $props();
	const media = useMedia();
	const item = $derived(findMedia(media(), props.image));
</script>

{#if item}
	<img src={item.url} alt={props.alt} style="max-width: 100%" />
{:else}
	<Empty icon={ImageIcon} text="Pick an image above" />
{/if}
```

```svelte
<!-- PhotoPreview.svelte -->
<script lang="ts">
	import { baseValue, findMedia, useMedia, type PluginPreviewProps } from '@atom-forge/brickee';
	import { aspect, type PhotoProps } from './PhotoView.svelte';

	let { props }: PluginPreviewProps<PhotoProps> = $props();
	const media = useMedia();
	const item = $derived(findMedia(media(), props.image));
</script>

{#if item}
	<img src={item.url} alt={props.alt ?? ''} style:aspect-ratio={aspect(baseValue(props.ratio))} />
{/if}

<style>
	img {
		width: 100%;
		object-fit: cover;
	}
</style>
```

```ts
// photo.ts
import { ImageIcon } from '@lucide/svelte';
import { findMedia, mdText, type BlockPlugin } from '@atom-forge/brickee';
import PhotoView, { type PhotoProps } from './PhotoView.svelte';
import PhotoPreview from './PhotoPreview.svelte';

export const photo: BlockPlugin<PhotoProps> = {
	type: 'photo',
	label: 'Photo',
	hint: 'One picked image',
	keys: 'photo image picture',
	icon: ImageIcon,
	props: () => ({ image: '', alt: '' }),
	fields: [
		{ key: 'image', label: 'Image', kind: 'image' },
		{ key: 'alt', label: 'Alt text', kind: 'text', placeholder: 'What the image shows' },
		{ key: 'ratio', label: 'Height', kind: 'slider', min: 20, max: 150, unit: '%', none: 'Original' }
	],
	tag: () => 'photo',
	content: 'none',
	markdown: (p, { media }) => {
		const url = findMedia(media, p.image)?.url;
		return url ? `![${mdText(p.alt)}](${url})` : '';
	},
	view: PhotoView,
	preview: PhotoPreview
};
```

Give the editor and the preview the same media:

```svelte
<script lang="ts">
	import { Editor, Preview, type MediaItem, type StoredBlock } from '@atom-forge/brickee';
	import { photo } from './photo';

	let { value = $bindable(), media }: { value: StoredBlock[]; media: MediaItem[] } = $props();
</script>

<Editor bind:value plugins={[photo]} {media} />
<Preview blocks={value} plugins={[photo]} {media} />
```

In a plugin component, read the list with `useMedia()` — it returns a function, so the list stays current — and find an item with `findMedia(list, id)`, as the photo's view and preview do.

> **Thumbnails in the editor**
>
> The editor only needs small images. Because blocks store ids, you can give the editor a list of thumbnail URLs and the preview on the site a list of full-size URLs with the same ids.

Typical sources are a page's uploaded attachments or a media library. Every image a document refers to must be in the list, or its block renders nothing.

## Per-view values

Some settings depend on how the page is shown: an image may need a different aspect ratio on a phone than on a wide screen. A `slider` field with `views` stores a value per view:

```ts
import type { BlockPlugin } from '@atom-forge/brickee';
import { gap } from '@atom-forge/brickee/plugins';
import { photo } from './photo';

export const VIEWS = [
	{ key: 'desktop', label: 'Desktop' },
	{ key: 'tablet', label: 'Tablet' },
	{ key: 'phone', label: 'Phone' }
];

/** The same plugin, with one of its fields set per view. */
const perView = (plugin: BlockPlugin, key: string): BlockPlugin => ({
	...plugin,
	fields: plugin.fields?.map((f) => (f.key === key ? { ...f, views: VIEWS } : f))
});

export const plugins = [perView(photo, 'ratio'), perView(gap, 'lines')];
```

Which views exist and which one is shown is the host's business. The host tells the editor the current view with `provideView`, typically from a width switch beside the editor:

```svelte
<script lang="ts">
	import { Editor, provideView, type StoredBlock } from '@atom-forge/brickee';
	import { plugins } from './blocks';

	let { value = $bindable(), view }: { value: StoredBlock[]; view: string } = $props();
	provideView(() => view);
</script>

<Editor bind:value {plugins} />
```

How the values behave:

- The first view is the **base**. Each other view, while it has no value of its own, takes the value of the view before it; the field then shows the value marked as inherited.
- The field edits the value of the current view and shows that view's label beside its own. Without `provideView`, or with a key that is not in `views`, it edits the base value.
- Stored: only a base value → stored alone, as a plain value (`"ratio": "56"`); own values for other views → an object keyed by view (`"ratio": { "desktop": "56", "phone": "100" }`). Documents written before a field became per-view stay valid.

A preview reads them with `viewValues(value, keys)` — the value for each view, inheritance applied — or just the base with `baseValue(value)`. This version of the photo preview gives the browser one aspect ratio per width through CSS variables:

```svelte
<script lang="ts">
	import { findMedia, useMedia, viewValues, type PluginPreviewProps } from '@atom-forge/brickee';
	import { aspect, type PhotoProps } from './PhotoView.svelte';

	let { props }: PluginPreviewProps<PhotoProps> = $props();
	const media = useMedia();
	const item = $derived(findMedia(media(), props.image));
	// desktop, tablet, phone: a CSS aspect-ratio each ('auto': the image's own shape)
	const r = $derived(viewValues(props.ratio, ['desktop', 'tablet', 'phone']).map((v) => aspect(v) ?? 'auto'));
</script>

{#if item}
	<img src={item.url} alt={props.alt ?? ''} style:--r-desktop={r[0]} style:--r-tablet={r[1]} style:--r-phone={r[2]} />
{/if}

<style>
	img {
		width: 100%;
		object-fit: cover;
		aspect-ratio: var(--r-phone);
	}
	@media (min-width: 640px) {
		img {
			aspect-ratio: var(--r-tablet);
		}
	}
	@media (min-width: 1024px) {
		img {
			aspect-ratio: var(--r-desktop);
		}
	}
</style>
```

> **Sliders only**
>
> `views` is supported on `slider` fields. Other field kinds ignore it.

## UI text

The editor and the plugins are written in English, and the English text is the key of its translation. Pass `messages` — an object from English text to your language — to the top-level editor and preview:

```svelte
<script lang="ts">
	import { Editor, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { hu } from '@atom-forge/brickee/locales/hu';

	let value = $state<StoredBlock[]>([]);
</script>

<Editor bind:value plugins={PLUGINS} messages={hu} />
```

`@atom-forge/brickee/locales/hu` exports `hu`, the Hungarian text of the editor and of every bundled plugin. Extend it with the text of your own plugins and fields:

```ts
import type { Messages } from '@atom-forge/brickee';
import { hu } from '@atom-forge/brickee/locales/hu';

export const messages: Messages = {
	...hu,
	Button: 'Gomb',
	'A link as a button': 'Egy link gombként',
	Desktop: 'Asztali',
	Phone: 'Telefon'
};
```

What the editor translates by itself:

- the built-in and plugin `label`, `hint` and `keys` (the slash menu searches the English and the translated words);
- the parts of a plugin's `tag`, split at ` · `;
- field labels, placeholders, option labels, `none` labels and view labels;
- the text of `Empty`, and the editor's own interface.

Text a plugin renders itself — in its view or preview — goes through `useText()`:

```svelte
<script lang="ts">
	import { useText, type PluginPreviewProps } from '@atom-forge/brickee';

	let { props }: PluginPreviewProps = $props();
	const tr = useText();
</script>

<p>{tr('Map: {place}', { place: String(props.q ?? '') })}</p>
```

`{name}` placeholders are filled from the second argument. Outside components, `translator(messages)` returns the same kind of function. A text missing from `messages` stays English.
