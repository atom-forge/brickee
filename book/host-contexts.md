---
type: chapter
requires: [block-plugin]
teaches: [per-view-values]
---
# Host contexts

The editor has no props for application concepts. What a host knows — the page width it is showing, the code languages it highlights, its language — reaches the plugins through three Svelte contexts. Each has a `provide…` function, called in a component's initialization above the editor or preview, and a `use…` function for plugin components.

| Context | Provide | Read | Carries |
|---|---|---|---|
| View | `provideView(() => key)` | `useView()` | The view per-view fields edit. |
| Code languages | `provideCodeLanguages(() => list)` | `useCodeLanguages()` | The languages a code block offers. |
| Text | `messages` prop, or `provideText(() => messages)` | `useText()` | UI text in the host's language. |

Nested editors and previews inherit all three from their parent.

Images are not a context: what an image block stores and where its pictures come from is decided by the app's own plugin (see [[writing-plugins#Images|Images]]).

## Per-view values

Some settings depend on how the page is shown: an image may need a different aspect ratio on a phone than on a wide screen. A `slider` field with `views` stores a value per view. Here it is the height of the `photo` plugin from [[writing-plugins#Images|Writing plugins]] and the bundled `gap`:

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
	import { viewValues, type PluginPreviewProps } from '@atom-forge/brickee';
	import { aspect, imageSrc, type PhotoProps } from './PhotoView.svelte';

	let { props }: PluginPreviewProps<PhotoProps> = $props();
	const src = $derived(imageSrc(props.url));
	// desktop, tablet, phone: a CSS aspect-ratio each ('auto': the image's own shape)
	const r = $derived(viewValues(props.ratio, ['desktop', 'tablet', 'phone']).map((v) => aspect(v) ?? 'auto'));
</script>

{#if src}
	<img {src} alt={props.alt ?? ''} style:--r-desktop={r[0]} style:--r-tablet={r[1]} style:--r-phone={r[2]} />
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

> [!note] Sliders only
> `views` is supported on `slider` fields. Other field kinds ignore it.

## Code languages

A code block's language (`props.lang`, the info string of its markdown fence) is free text by default. When the host knows which languages its site can highlight, it gives the list, and the field in the code block's fields bar becomes a dropdown of them, with *None* first:

```svelte
<script lang="ts">
	import { Editor, provideCodeLanguages, type StoredBlock } from '@atom-forge/brickee';

	let { value = $bindable() }: { value: StoredBlock[] } = $props();
	provideCodeLanguages(() => [{ value: 'ts', label: 'TypeScript' }, { value: 'svelte', label: 'Svelte' }, 'css', 'bash']);
</script>

<Editor bind:value />
```

An item is a string or `{ value, label? }`; the value is what is stored. Nested editors inherit the list. A stored language missing from the list stays an option, so opening an older document loses nothing.

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
