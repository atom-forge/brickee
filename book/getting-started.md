---
type: chapter
teaches: [brickee-layers]
---
# Getting started

## What Brickee is

Brickee is a block editor: a document is a list of blocks, each edited on its own row, reordered by dragging, and turned into another type from its handle. The core blocks are markdown — paragraphs, six heading levels, bulleted, numbered and to-do lists, quotes, code and dividers — so a document without plugins reads and copies as plain markdown.

Everything else is a plugin. A plugin is a plain object (`BlockPlugin`) that names a block type and gives it:

- a **view** — a Svelte component shown in the editor;
- a **preview** — a Svelte component that renders the block on the site;
- **fields** — the settings shown on the top of the block (text, colour, select, slider, image…);
- optionally a **markdown form**, used when the document is copied or exported as markdown.

The package ships four general-purpose plugins — table, YouTube video, map and gap — but they are plugins like any other: nothing in the core depends on them, and you pass only the ones you want. Image blocks, boxes and other site-specific blocks are plugins you write yourself.

## Installation

```sh
bun add @atom-forge/brickee @atom-forge/ui @lucide/svelte
```

| Peer dependency | Why |
|---|---|
| `svelte` `^5.0.0` | The editor, the preview and the plugins are Svelte 5 components. |
| `@atom-forge/ui` `>=0.0.37` | The popups (link prompt, image picker) and the form controls of the block fields. |
| `@lucide/svelte` `>=1.0.0` | The block icons. |
| `zod` `^4.0.0` (optional) | Only for the server-side schema in `@atom-forge/brickee/schema`. |

## Host setup

The block fields and popups are `@atom-forge/ui` components, so the application must be set up the way `@atom-forge/ui` requires:

- Tailwind CSS 4 with the `@atom-forge/ui` theme CSS imported and its `dist` folder added as a Tailwind `@source`;
- the application rendered beneath the `@atom-forge/ui` `Root` component, which provides the theme and the overlay contexts.

The top-level `Editor` creates its own popup manager and renders its own popup container; editors nested in plugin blocks share it.

> [!warning] Missing theme
> Without the `@atom-forge/ui` theme CSS the editor still works, but the block fields, the colour picker, the slider and the popups appear unstyled.

The preview adds only the little styling it needs itself (to-do checkboxes, image widths, floats). The typography of headings, paragraphs and lists comes from the page that shows the preview.

## A first editor

```svelte
<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';

	let value = $state<StoredBlock[]>([]);
</script>

<Editor bind:value plugins={PLUGINS} />

<article>
	<Preview blocks={value} plugins={PLUGINS} />
</article>
```

- `value` is the document as JSON (`StoredBlock[]`). The editor writes it back on every change; save it as it is.
- `plugins` lists the plugin blocks the editor can show and offer. Leave it out and you have a plain markdown editor.
- `Preview` renders the same document with the same plugins, the way the site shows it.

Type `/` in an empty line to open the block menu.

## Entry points

| Import | Contents |
|---|---|
| `@atom-forge/brickee` | `Editor`, `Preview`, the kit (`Frame`, `Empty`, helpers), the stored form, the markdown conversions, the contexts, the palette, the types. |
| `@atom-forge/brickee/plugins` | The bundled plugins (`table`, `youtube`, `map`, `gap`), `PLUGINS` with all four, and their helpers. |
| `@atom-forge/brickee/schema` | `blocksSchema` and `blocksSchemaFor` (zod), for server-side validation. |
| `@atom-forge/brickee/model` | The stored form without Svelte: `StoredBlock`, `MD`, `isMd`, `acceptsId`, `blocksToPlainText`… |
| `@atom-forge/brickee/locales/hu` | `hu`: the Hungarian UI text. |

> [!tip] Only what you import is bundled
> The bundled plugins live in their own entry point. An application that imports only `@atom-forge/brickee` gets the markdown editor without any plugin code.
