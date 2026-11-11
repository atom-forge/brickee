# Recipes and pitfalls

[← Previous](server-side.md) · [Contents](index.md) · [Next →](upgrading.md)

## One place for the block setup

Keep the plugins, palettes and messages of an application in one module, and wrap the editor in a component of your own. Pages then use the wrapper and never repeat the setup.

```ts
// lib/blocks.ts
import type { BlockPlugin, Messages } from '@atom-forge/brickee';
import * as base from '@atom-forge/brickee/plugins';
import { hu } from '@atom-forge/brickee/locales/hu';
import SiteYouTube from './SiteYouTube.svelte';
import { photo } from './photo';
import { button } from './button';

const withPreview = (plugin: BlockPlugin, preview: BlockPlugin['preview']): BlockPlugin => ({ ...plugin, preview });

export const plugins: BlockPlugin[] = [
	withPreview(base.youtube, SiteYouTube),
	base.table,
	base.map,
	base.gap,
	photo,
	button
];

/** The full palette, for editors of the site's own pages. */
export const PAGE_PALETTE = ['md:p', 'md:h2', 'md:h3', 'md:ul', 'md:ol', 'md:quote', 'md:hr', ...plugins.map((p) => p.type)];

/** A smaller one, for user comments. */
export const COMMENT_PALETTE = ['md:p', 'md:ul', 'md:ol', 'md:quote', 'photo'];

export const messages: Messages = { ...hu, Button: 'Gomb', 'A link as a button': 'Egy link gombként' };
```

```svelte
<!-- lib/BlockEditor.svelte -->
<script lang="ts">
	import { Editor, provideView, type StoredBlock } from '@atom-forge/brickee';
	import { messages, PAGE_PALETTE, plugins } from './blocks';

	let {
		value = $bindable(),
		palette = PAGE_PALETTE,
		view
	}: { value: StoredBlock[]; palette?: string[]; view?: string } = $props();

	provideView(() => view);
</script>

<Editor bind:value {plugins} {palette} {messages} />
```

Render the published page with `<Preview blocks={doc} {plugins} {messages} />` and the same `plugins`, so a block looks the same in the editor's preview and on the site.

## Copying the whole document as markdown

Copying selected blocks already puts markdown on the clipboard. For a "Copy as markdown" button for the whole document:

```svelte
<script lang="ts">
	import { fromStored, toMarkdown, type StoredBlock } from '@atom-forge/brickee';
	import { plugins } from './blocks';

	let { doc }: { doc: StoredBlock[] } = $props();

	// Runs in a click handler, so the browser-only toMarkdown is safe here.
	const copy = () => navigator.clipboard.writeText(toMarkdown(doc.map(fromStored), { plugins }));
</script>

<button type="button" onclick={copy}>Copy as markdown</button>
```

## Starting a document from markdown

```ts
import { fromMarkdown, toStored, type StoredBlock } from '@atom-forge/brickee';

// In the browser: toStored reads the inline HTML through the DOM.
export const fromText = (text: string): StoredBlock[] => fromMarkdown(text).map(toStored);
```

A paragraph's lines stay one block, with line breaks between them; a blank line starts a new block.

## Developing against a local copy

When you link a local checkout of the package into an application (`bun link`), the linked folder brings its own `node_modules`. Make Vite use the application's single copy of the shared packages, otherwise Svelte contexts — the popup manager, the theme — are not found across the two copies:

```ts
// vite.config.ts of the application
export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		dedupe: ['svelte', '@atom-forge/ui', '@lucide/svelte', 'zod']
	}
});
```

The application reads the package's built `dist/`, so rebuild the package after each change.

## Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| The editor's rows, menus or table look unstyled or shrunk | The `@atom-forge/brickee` `dist` folder is not a Tailwind `@source` | Add `@source "../node_modules/@atom-forge/brickee/dist";` beside the `@atom-forge/ui` one. |
| Block fields and popups look unstyled | The `@atom-forge/ui` theme CSS or its Tailwind `@source` is missing | Set up `@atom-forge/ui` as its documentation describes and render the app beneath its `Root`. |
| Block handles stick out on the left | The handles are drawn left of the editor's box | Give the element around the editor about 22 px of left padding. |
| Popups do not open, or "context not found" errors with a linked package | Two copies of `svelte` or `@atom-forge/ui` | Add them to Vite's `resolve.dedupe`. |
| A plugin block shows "Unknown block" | Its plugin is missing from `plugins` | Pass the same plugins to every editor and preview of a document type. |
| A block is missing from `Preview` | Its plugin has no `preview` | Give the plugin a `preview` (the bundled ones have a default), or render the block with your own renderer. |
| A plugin block is missing from the site | The preview got other `plugins` | Use the same plugin list for the editor and the preview. |
| An image block renders nothing | Its preview rejects the stored address, or the app's own lookup does not know the stored id | Store addresses the preview accepts (`http(s)` or site-relative); resolve ids from the same data in the editor and on the site. |
| A box cannot be put inside another box | Nested editors go one level deep | Design containers to hold content blocks, not other containers. |
| A block is not offered inside a container | Its `accepts` or the host `palette` leaves it out | Add the palette id to `accepts` (or use `'md:*'` for every built-in). |
| A unique block appears twice | The schema does not enforce `unique` | Check it on the server if your application relies on it. |
| `document is not defined` | `toMarkdown` or `toStored` ran during SSR | Call them in the browser only. |
| A colour or link from props breaks the page | Props are user input | Use `safeColor`, check links, never use `{@html}` with props. |
| Overridden plugin loses its blocks | Its `type` was changed | Keep `type` when spreading a plugin. |
| `bind:blocks` error in a custom view | `props` or `blocks` not declared bindable | Declare both with `$bindable()`. |
| The value is never an empty array | The editor shows (and writes) one empty paragraph for an empty document | Treat a document with only empty paragraphs as empty, for example with `blocksToPlainText(doc).trim() === ''`. |
| The preview does not follow the editor's scrolling | The actions are not on the boxes that scroll | Put `use:sync.source` / `use:sync.target` on the `overflow` boxes themselves. |
