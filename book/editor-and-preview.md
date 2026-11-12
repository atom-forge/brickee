---
type: chapter
requires: [brickee-layers]
teaches: [palette]
---
# The editor and the preview

## Editor props

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `value` | `StoredBlock[]` (bindable) | `[]` | The document. Written back on every change (unchanged blocks keep their objects); a document replaced from outside — a new array, not one changed in place — is loaded again, unless it equals the current one. |
| `plugins` | `BlockPlugin[]` | `[]` | The plugin blocks this editor can show and offer. |
| `palette` | `string[]` | every built-in block, then every plugin | The block types the slash menu offers, in this order (see below). |
| `messages` | `Messages` | — | UI text in the host's language: English text → translation. |
| `inlinePlugins` | `InlinePlugin[]` | — | Elements inside the text, such as a formula (see [[writing-plugins#inline-plugins|Inline plugins]]); nested editors share their parent's. |
| `readonly` | `boolean` | `false` | Shows the document without editing; plugin fields are hidden. A read-only editor never writes `value`. |
| `placeholder` | `string` | `Write something, or press '/' for blocks…` | The hint of an empty block. |
| `nested` | `boolean` | `false` | Set by plugins with nested blocks for their inner editor; a host never sets it. |

An empty document is shown as one empty paragraph, so the value the editor writes back is never an empty array once it has been mounted: it is at least `[{ type: 'md:p', indent: 0, text: '' }]`. The preview skips empty paragraphs.

## Preview props

| Prop | Type | Default | Meaning |
|---|---|---|---|
| `blocks` | `StoredBlock[]` | — | The document to render. |
| `plugins` | `BlockPlugin[]` | — | The plugins whose previews render the plugin blocks. |
| `messages` | `Messages` | — | UI text in the host's language. |
| `inlinePlugins` | `InlinePlugin[]` | — | The same inline plugins as the editor's. |
| `nested` | `boolean` | `false` | Set by plugin previews that render their nested blocks. |

The preview renders built-in blocks as plain HTML (`p`, `h1`…`h6`, `ul`/`ol` with nested items, `blockquote`, `pre > code` with a `language-<lang>` class, `hr`) and each plugin block with its plugin's `preview`. A block whose type has no plugin in `plugins`, or whose plugin has no `preview`, is not rendered.

Using `Preview` at all is your choice: the editor does not depend on it. An application with its own renderer can render the stored blocks itself, and its plugins can leave `preview` out.

`messages` given to the top-level editor or preview are inherited by every nested editor, nested preview and plugin component below it.

## The palette

The `palette` is a list of **palette ids**: `md:p`, `md:h1`…`md:h6`, `md:ul`, `md:ol`, `md:todo`, `md:quote`, `md:code`, `md:hr` for the built-in blocks, and a plugin's `type` for a plugin. It decides:

- which blocks the slash menu and the Turn-into menu offer, and in which order;
- which markdown shortcuts work (typing `## ` turns a paragraph into a heading only if `md:h2` is in the palette);
- what pasted markdown may become: a pasted block of a type outside the palette becomes a paragraph, and a divider is dropped.

A plain paragraph (`md:p`) is always allowed as the fallback.

```svelte
<script lang="ts">
	import { Editor, type StoredBlock } from '@atom-forge/brickee';
	import { map, table, youtube } from '@atom-forge/brickee/plugins';

	const plugins = [table, youtube, map];
	// No h1 (the page title is one) and no code blocks.
	const palette = ['md:p', 'md:h2', 'md:h3', 'md:ul', 'md:ol', 'md:quote', 'md:hr', ...plugins.map((p) => p.type)];

	let value = $state<StoredBlock[]>([]);
</script>

<Editor bind:value {plugins} {palette} />
```

`PALETTE_ITEMS` lists the built-in blocks with their labels, hints and icons; `BUILT_IN_IDS` is just their ids in the default order.

> [!note] The palette limits offering, not loading
> A document that already holds a block outside the palette still shows it. A plugin block whose plugin is missing from `plugins` is kept as it is and shown as an unknown block that can only be deleted. To reject such documents, validate them on the server (see [[server-side|On the server]]).

## Editing

| Action | How |
|---|---|
| Insert a block | `/` opens the slash menu (searchable by label, hint, keywords and their translations); the `+` button adds a block below. |
| Markdown shortcuts | At the start of a paragraph: `# `…`###### `, `- ` / `* ` / `+ `, `1. `, `[] `, `> `. |
| Inline formatting | Select text for the toolbar, or `Ctrl/Cmd` + `B` bold, `I` italic, `U` underline, `Shift+X` strikethrough, `E` code, `K` link, `\` remove formatting. Subscript and superscript are on the toolbar. Typed markdown turns into its mark: `**bold**`, `*italic*` / `_italic_`, `~~strike~~` once a space, a punctuation mark or `Enter` follows; `` `code` `` and `[text](url)` on their closing character. `Ctrl/Cmd+Z` right after brings back the text as typed. |
| Indent | `Tab` / `Shift+Tab` (at most 6 levels). |
| Line break | `Shift+Enter`; in a code block `Enter` breaks the line and `Shift+Enter` or `Ctrl/Cmd+Enter` starts a new block. |
| Select blocks | Click (or tap) a block's handle, `Esc` in a block, `Shift+↑/↓` past the edge of a block, or drag a text selection across blocks. `Ctrl/Cmd+A` in an empty block selects every block. |
| Move blocks | Drag the handle (also into and out of nested editors), `Ctrl/Cmd+Shift+↑/↓`, or *Move up* / *Move down* in the Turn-into menu (without dragging: touch screens, keyboard). |
| Turn into | Click the handle of a block or a selection for the Turn-into menu; from the keyboard `/` (or `Ctrl/Cmd+/`, the menu key, `Shift+F10`) on selected blocks, or `Ctrl/Cmd+/` in a block's text. On a touch screen a tapped block shows its actions (add below, turn into, delete) beside its handle. |
| Copy, cut, paste | Copying selected blocks puts their markdown on the clipboard (plugin blocks through their markdown form) and, beside it, the blocks themselves (`application/x-brickee+json`). Formatted text from elsewhere (a web page, Google Docs, Word) keeps its headings, lists, tables and marks (`fromHtml`); plain text is read as markdown. Pasted into a Brickee editor, copied blocks come back as they were; a plugin block that editor does not offer (or a second unique one) falls back to its markdown form. Pasted anywhere else, the markdown arrives. Pasting while blocks are selected puts the blocks after them. |
| Paste | Multi-line text is read as markdown and becomes blocks. |
| Undo, redo | `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y`. |
| Escape | `Esc` closes an open menu or link field; in a block's text it selects the block; on selected blocks it goes back to the text. In an `@atom-forge/ui` modal or drawer only the last one reaches the overlay: the first `Esc` in a block selects it, the second also closes the modal or drawer. |

What a block can turn into depends on what it holds (its `content`):

- text blocks turn into each other and keep their formatting; turning text into code keeps only the letters;
- a block without content (divider, video, map) only replaces empty blocks or other blocks without content;
- a block with nested blocks (a box) can wrap the selected blocks, if it accepts all of them; **Unwrap** moves a box's blocks out; a box can turn into another box-like type, and the props with the same names carry over.

## Scroll sync

A host that shows the editor and the preview side by side can make the preview follow the editor's scrolling. `scrollSync()` returns two Svelte actions and a function:

```svelte
<script lang="ts">
	import { Editor, Preview, scrollSync, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';

	let value = $state<StoredBlock[]>([]);
	const sync = scrollSync();
</script>

<div class="split">
	<div class="pane" use:sync.source>
		<Editor bind:value plugins={PLUGINS} />
	</div>
	<div class="pane" use:sync.target>
		<Preview blocks={value} plugins={PLUGINS} />
	</div>
</div>

<style>
	.split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		height: 100vh;
	}
	.pane {
		overflow-y: auto;
	}
</style>
```

- `use:sync.source` goes on the editor's scrolling box, `use:sync.target` on the preview's. The target is scrolled to the same fraction (0…1) of its scroll range as the source. The sync is one way: scrolling the preview moves nothing else.
- It re-syncs once per animation frame when the source scrolls, and when the target box or its children change size. `sync.align()` re-syncs on demand, for example after the preview's width changed.
- `use:sync.target={on}` takes a boolean (default `true`), for a host that switches the target between two boxes, such as a desktop pane and a phone frame: turn on the visible one.
- The sync is proportional only: both boxes show roughly the same place, not exactly the same block. This is deliberate — it needs no markup and works with any preview.

`scrollFraction(box)` reads how far a box is scrolled (0…1; 0 when it does not scroll), and `setScrollFraction(box, f)` scrolls it there — for example to keep the place when the preview changes width while it is shown alone:

```ts
import { scrollFraction, setScrollFraction } from '@atom-forge/brickee';
import { tick } from 'svelte';

export async function keepPlace(box: HTMLElement, change: () => void) {
	const f = scrollFraction(box);
	change(); // e.g. switch the preview width
	await tick();
	setScrollFraction(box, f);
}
```
