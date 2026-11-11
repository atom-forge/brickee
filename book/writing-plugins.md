---
type: chapter
requires: [stored-block, palette]
teaches: [block-plugin]
---
# Writing plugins

A plugin is a `BlockPlugin` object plus two Svelte components: a **view** for the editor and a **preview** for the site. Everything a plugin needs is exported from `@atom-forge/brickee` — the bundled plugins use nothing else.

## Anatomy

| Member | Type | Meaning |
|---|---|---|
| `type` | `string` | The stored `type`. Must not start with `md:`; to pass the schema it must match `^[a-z][a-z0-9:-]{0,39}$`. |
| `label`, `hint` | `string` | Name and short description in the slash and Turn-into menus. |
| `keys` | `string` | Extra search words for the slash menu. |
| `icon` | `Icon` | A `@lucide/svelte` icon component. |
| `props` | `() => P` | The props of a new block. |
| `fields` | `PropField[]` | The settings on the top of the block (optional). |
| `tag` | `(props: P) => string` | The small label on the top of the block, before its fields. Parts separated by ` · ` are translated one by one. |
| `content` | `'none' \| 'text' \| 'plain' \| 'blocks'` | What the block holds. Plugins use `'none'` (props only) or `'blocks'` (a nested document); it decides what Turn-into offers. |
| `view` | `Component<PluginViewProps>` | The block in the editor. |
| `preview` | `Component<PluginPreviewProps>` | The block on the site (optional). Without it, `Preview` renders nothing for the block — for apps that render stored blocks with their own renderer. |
| `accepts` | `string[]` | A container's allowed nested blocks, as palette ids; `'md:*'` is every built-in block. Default: everything the host offers. |
| `markdown` | `(props: P, ctx: MarkdownContext) => string` | Its markdown form (optional). |
| `unique` | `boolean` | At most one per document, top level only. |

`P` is the props type of the plugin; declare it as an interface extending `Record<string, unknown>`.

## A plugin without content

A link button: a label, a link, a size and a colour — all set in fields, nothing typed into the block itself.

```ts
// safe-url.ts — only links the site should render
export const safeUrl = (u: unknown) => {
	const s = String(u ?? '').trim();
	return /^(https?:|mailto:|\/(?!\/))/.test(s) ? s : '';
};
```

```svelte
<!-- ButtonView.svelte: the block in the editor -->
<script lang="ts" module>
	export interface ButtonProps extends Record<string, unknown> {
		label: string;
		url: string;
		size: 'normal' | 'large';
		color: string;
	}
</script>

<script lang="ts">
	import { MousePointerClick } from '@lucide/svelte';
	import { Empty, safeColor, type PluginViewProps } from '@atom-forge/brickee';

	// Both bindable, even when the view does not use them: the editor binds them on every plugin view.
	let { props = $bindable(), blocks = $bindable() }: PluginViewProps<ButtonProps> = $props();
</script>

{#if props.label}
	<span class="button" style:background={safeColor(props.color, '#2563eb')}>{props.label}</span>
{:else}
	<Empty icon={MousePointerClick} text="Set the label and the link above" />
{/if}

<style>
	.button {
		display: inline-block;
		padding: 0.5em 1.2em;
		border-radius: 8px;
		color: #fff;
	}
</style>
```

```svelte
<!-- ButtonPreview.svelte: the block on the site -->
<script lang="ts">
	import { safeColor, type PluginPreviewProps } from '@atom-forge/brickee';
	import type { ButtonProps } from './ButtonView.svelte';
	import { safeUrl } from './safe-url';

	let { props }: PluginPreviewProps<ButtonProps> = $props();
	const href = $derived(safeUrl(props.url));
</script>

{#if href && props.label}
	<p>
		<a class="button" class:large={props.size === 'large'} {href} style:background={safeColor(props.color, '#2563eb')}>
			{props.label}
		</a>
	</p>
{/if}
```

```ts
// button.ts: the plugin
import { MousePointerClick } from '@lucide/svelte';
import { mdText, type BlockPlugin } from '@atom-forge/brickee';
import ButtonView, { type ButtonProps } from './ButtonView.svelte';
import ButtonPreview from './ButtonPreview.svelte';
import { safeUrl } from './safe-url';

export const button: BlockPlugin<ButtonProps> = {
	type: 'button',
	label: 'Button',
	hint: 'A link as a button',
	keys: 'button link cta',
	icon: MousePointerClick,
	props: () => ({ label: '', url: '', size: 'normal', color: '#2563eb' }),
	fields: [
		{ key: 'label', label: 'Label', kind: 'text' },
		{ key: 'url', label: 'Link', kind: 'text', placeholder: 'https://…', parse: (s) => s.trim() },
		{
			key: 'size',
			label: 'Size',
			kind: 'select',
			options: [
				{ value: 'normal', label: 'Normal' },
				{ value: 'large', label: 'Large' }
			]
		},
		{ key: 'color', label: 'Colour', kind: 'color' }
	],
	tag: (p) => (p.size === 'large' ? 'button · large' : 'button'),
	content: 'none',
	markdown: (p) => {
		const href = safeUrl(p.url);
		return href ? `[${mdText(p.label) || href}](${href})` : '';
	},
	view: ButtonView,
	preview: ButtonPreview
};
```

Register it beside the others:

```svelte
<Editor bind:value plugins={[...PLUGINS, button]} />
<Preview blocks={value} plugins={[...PLUGINS, button]} />
```

> [!danger] Props come from users
> A plugin's props are whatever was stored — typed by an editor, pasted, or sent to your API by anyone who can save a document. The schema only checks the shape. Every preview must treat props as untrusted: take colours through `safeColor`, check links and image addresses, and clamp numbers. Svelte escapes text in `{...}`; never put a prop into `{@html}`.

## Fields

Each `PropField` is one setting on the top of the block. The editor draws them and stores their values in `props`.

| Member | Meaning |
|---|---|
| `key` | The prop it edits. |
| `label` | Its label (translated through `messages`). |
| `kind` | `text`, `textarea`, `color`, `select`, `slider` or `toggles`. |
| `placeholder` | Hint of an empty text field; for an optional colour, the colour a click on "none" starts from. |
| `options` | `{ value, label }[]` for `select`, and for a `slider` that steps through values. An option label may use `{n}`, filled with its value. For `toggles`, `{ value, label, icon }[]`: `icon` is the button, `label` its tooltip. |
| `min`, `max`, `step`, `unit` | A number `slider`: its range, step (default 1) and the unit shown after the value. |
| `none` | The label of the unset state: a number slider's notch left of `min`, or an optional colour's "none" button. |
| `views` | Per-view values for a `slider` (see [Per-view values](host-contexts.md#per-view-values)). |
| `format` | The field's text from the stored value (default: the value as a string). |
| `parse` | The stored value from the field's text (default: the text). |

How each kind stores its value:

| Kind | Stored value |
|---|---|
| `text`, `textarea` | The text, or what `parse` returns (`parse: lines` stores a list of lines). |
| `select` | The chosen option's `value`. |
| `slider` with `options` | The value of the option at the slider's position. |
| `slider` with `min` and `max` | The number as a string (for example `'56'`); the `none` notch removes the key. |
| `color` | A `#rrggbb` string; with `none`, clearing it removes the key. |
| `toggles` | The list of the options switched on, in `options` order (`[]` when none); the bundled table's header and footer are one. |

An empty value (`''`, `null` or `undefined`, also when returned by `parse`) removes the key from `props`, so a preview must always handle a missing prop. A field's `parse` is also a good place to normalize input: the bundled YouTube field accepts any YouTube link and stores only the video id.

## The view

The view receives `PluginViewProps`:

| Prop | Meaning |
|---|---|
| `props` | The block's props (bindable): a view may also edit them in place, as the table does. |
| `blocks` | The nested document (bindable); always `[]` for a plugin without content. |
| `readonly` | The editor is read-only. |
| `palette`, `plugins` | The host's palette (already narrowed to `accepts`) and plugins, for a nested editor. |

Declare `props` and `blocks` with `$bindable()` even when the view does not use them. The fields are drawn above the view automatically; a view only has to show the block. `Empty` (props `icon` and `text`) is the dashed placeholder the bundled plugins show until their props are set; its text is translated.

## The preview

The preview receives `PluginPreviewProps`: `props`, `blocks` and `plugins`. It is a plain Svelte component that renders the block for the site. Messages and the view are available through the contexts (`useText`, `useView`; see [[host-contexts|Host contexts]]); images are the plugin's own business (see [[writing-plugins#Images|Images]]).

## Containers

A plugin with `content: 'blocks'` holds a nested document in `blocks`. Its view uses `Frame`, a thin box that draws the block's fields on its top and a nested editor below; its preview renders the inner blocks with a nested `Preview`.

```svelte
<!-- NoteView.svelte -->
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
```

```svelte
<!-- NotePreview.svelte -->
<script lang="ts">
	import { Preview, type PluginPreviewProps } from '@atom-forge/brickee';
	import type { NoteProps } from './NoteView.svelte';

	let { props, blocks, plugins }: PluginPreviewProps<NoteProps> = $props();
</script>

<aside class="note">
	{#if props.title}<p class="note-title">{props.title}</p>{/if}
	<Preview {blocks} {plugins} nested />
</aside>
```

```ts
// note.ts
import { StickyNote } from '@lucide/svelte';
import { mdJoin, mdQuote, mdText, type BlockPlugin } from '@atom-forge/brickee';
import NoteView, { type NoteProps } from './NoteView.svelte';
import NotePreview from './NotePreview.svelte';

export const note: BlockPlugin<NoteProps> = {
	type: 'note',
	label: 'Note',
	hint: 'Boxed text with a title',
	keys: 'note aside box',
	icon: StickyNote,
	props: () => ({ title: '' }),
	fields: [{ key: 'title', label: 'Title', kind: 'text' }],
	tag: () => 'note',
	content: 'blocks',
	accepts: ['md:p', 'md:ul', 'md:ol', 'youtube'],
	markdown: (p, { inner }) => mdQuote(mdJoin(p.title && `**${mdText(p.title)}**`, inner)),
	view: NoteView,
	preview: NotePreview
};
```

`Frame` props: `blocks` (bindable), `readonly`, `palette`, `plugins`, and optionally `placeholder` for the nested editor. `heading`, `empty` and `image` (a URL) make a heading line, which is shown only when the fields are not (read-only mode or no fields).

How nesting works:

- **One level.** A nested editor never offers blocks that hold blocks themselves, nor unique blocks. The schema rejects deeper documents.
- **`accepts`** narrows what the nested editor offers to the listed palette ids, in the host's order. `'md:*'` stands for every built-in block, so `['md:*', 'youtube']` is "text and videos". Without `accepts`, the nested editor offers everything the host does (minus containers and unique blocks).
- The host's `palette` still applies: `accepts` can only narrow it, never add to it.
- Wrapping blocks into a container from the Turn-into menu, and turning a container into another, is offered only when the container accepts every block going in.
- `blocksSchemaFor(plugins)` checks `accepts` on the server (see [[server-side|On the server]]).

## Unique blocks

**`unique: true`** — at most one per document, at the top level (a table of contents, for example). Once the document has one, the plugin leaves the slash and Turn-into menus, a second one pasted in falls back to its markdown form, and nested editors never offer it. The schema does not enforce it.

## Markdown form

`markdown(props, { inner })` returns the block as markdown, used when blocks are copied in the editor and by `toMarkdown`. `inner` is the nested blocks already as markdown (`''` without any).

Return `''` to leave the block out. Plugins whose output has no meaning as text (an ad slot, the bundled `gap`) simply have no markdown form. Three helpers keep the output well-formed:

| Helper | Does |
|---|---|
| `mdText(value)` | Plain text made safe inside markdown: escapes inline marks and `#`, joins lines. |
| `mdJoin(...parts)` | Joins parts as separate blocks (blank line between), leaving out empty and falsy ones. |
| `mdQuote(md)` | Prefixes every line with `> `, for a box rendered as a blockquote. |

## Taking pasted tables

When markdown with a GFM table is pasted into the editor, or imported with `fromMarkdown(text, { plugins })`, the table goes to the first plugin that has `fromTable`. It gets the table and returns the new block's props:

```ts
interface MarkdownTable {
	rows: string[][]; // the cells as inline markdown, row by row; the first row is the header
	align: ('left' | 'center' | 'right')[]; // per column, from the delimiter row (:--, :-:, --:)
}

fromTable?(table: MarkdownTable): P;
```

The bundled `table` has it (`fromTable: ({ rows, align }) => ({ rows, heads: ['top'], align })`), so a table pasted into an editor that offers it becomes a table block. Without such a plugin the table stays text.

## Images

The editor has no notion of images: no image field, no picker, no list of media. Whether a block stores an image's URL or the id of an image in the app's own media library, how the user picks it, and how the stored value becomes an address are the application's decisions, so an image block is an ordinary plugin of the app.

A minimal `photo` plugin stores the image's address, typed into a text field, with alt text and a height slider:

```svelte
<!-- PhotoView.svelte -->
<script lang="ts" module>
	export interface PhotoProps extends Record<string, unknown> {
		/** The image's address. */
		url: string;
		alt: string;
		/** The height in % of the width (20–150), or unset for the image's own shape. */
		ratio?: unknown;
	}

	/** The stored address if it is http(s) or site-relative, else ''. */
	export const imageSrc = (u: unknown) => {
		const s = String(u ?? '').trim();
		return /^(https?:|\/(?!\/))/.test(s) ? s : '';
	};

	/** A CSS aspect-ratio from a stored height, or undefined. */
	export const aspect = (v: unknown) => {
		const n = Number(v);
		return n >= 20 && n <= 150 ? `100 / ${n}` : undefined;
	};
</script>

<script lang="ts">
	import { ImageIcon } from '@lucide/svelte';
	import { Empty, type PluginViewProps } from '@atom-forge/brickee';

	let { props = $bindable(), blocks = $bindable() }: PluginViewProps<PhotoProps> = $props();
	const src = $derived(imageSrc(props.url));
</script>

{#if src}
	<img {src} alt={props.alt} style="max-width: 100%" />
{:else}
	<Empty icon={ImageIcon} text="Set the image's address above" />
{/if}
```

```svelte
<!-- PhotoPreview.svelte -->
<script lang="ts">
	import { baseValue, type PluginPreviewProps } from '@atom-forge/brickee';
	import { aspect, imageSrc, type PhotoProps } from './PhotoView.svelte';

	let { props }: PluginPreviewProps<PhotoProps> = $props();
	const src = $derived(imageSrc(props.url));
</script>

{#if src}
	<img {src} alt={props.alt ?? ''} style:aspect-ratio={aspect(baseValue(props.ratio))} />
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
import { mdText, type BlockPlugin } from '@atom-forge/brickee';
import PhotoView, { type PhotoProps } from './PhotoView.svelte';
import PhotoPreview from './PhotoPreview.svelte';

export const photo: BlockPlugin<PhotoProps> = {
	type: 'photo',
	label: 'Photo',
	hint: 'One image',
	keys: 'photo image picture',
	icon: ImageIcon,
	props: () => ({ url: '', alt: '' }),
	fields: [
		{ key: 'url', label: 'Image', kind: 'text', placeholder: 'https://…', parse: (s) => s.trim() },
		{ key: 'alt', label: 'Alt text', kind: 'text', placeholder: 'What the image shows' },
		{ key: 'ratio', label: 'Height', kind: 'slider', min: 20, max: 150, unit: '%', none: 'Original' }
	],
	tag: () => 'photo',
	content: 'none',
	markdown: (p) => {
		const src = imageSrc(p.url);
		return src ? `![${mdText(p.alt)}](${src})` : '';
	},
	view: PhotoView,
	preview: PhotoPreview
};
```

The address is a prop like any other, so it is untrusted: the view and the preview render it only when it is an `http(s)` or site-relative address, as the button checks its link.

Other apps choose differently, all within the plugin:

- **A media library.** The block stores the id of an image in the app's library instead of a URL. The view, the preview and `markdown` turn the id into an address with the app's own lookup: a module of the app, or the app's own Svelte context provided above the editor and the preview (plugin components are rendered beneath them). `markdown` runs outside components, when blocks are copied and in `toMarkdown`, so it can only use module data.
- **Picking.** Instead of a text field, the view can show its own picker — a button that opens the app's media dialog or an upload — and write the result into `props`, which is bindable.
- **Several images.** A gallery stores a list (of URLs or ids) in one prop and edits it in its view the same way.

## The kit

| Export | Kind | Use |
|---|---|---|
| `Frame` | component | The editor look of a container: fields on top, nested editor below. |
| `Empty` | component | The placeholder of a block whose props are not set yet. |
| `safeColor(value, fallback)` | function | A `#hex` colour (3–8 digits), or the fallback. |
| `lines(text)` | function | Trimmed, non-empty lines: a field's `parse` for "one per line" lists. |
| `baseValue(value)` | function | The base value of a per-view prop. |
| `viewValues(value, keys)` | function | A per-view prop's value for each view. |
| `mdText`, `mdJoin`, `mdQuote` | functions | Markdown forms (above). |
| `useText` | function | Translates the plugin's own UI text. |
| `useView` | function | The view the host is showing. |
| `Preview` | component | Renders a container's nested blocks (with `nested`). |
