# @atom-forge/brickee — AI guide

Compact reference for coding agents using `@atom-forge/brickee` in a Svelte 5 project. It is derived from [`docs/en/`](docs/en/index.md); where the two disagree, `docs/en/` is authoritative.

Brickee is a block editor. Its core is a markdown block editor (`md:p`, `md:h1`…`md:h6`, `md:ul`, `md:ol`, `md:todo`, `md:quote`, `md:code`, `md:hr`) plus the kit plugins are written with; every other block is a plugin with an editor view, a site preview, fields and optionally a markdown form. Documents are stored as JSON (`StoredBlock[]`). The bundled plugins (`@atom-forge/brickee/plugins`) are plugins like any other, opt-in.

## Rules

- Peers: `svelte` 5, `@atom-forge/ui` (popups and field controls), `@lucide/svelte`; `zod` only for `@atom-forge/brickee/schema`. The app must set up `@atom-forge/ui` (Tailwind 4, its theme CSS and `@source`, the app beneath its `Root`) and add `@atom-forge/brickee/dist` as a Tailwind `@source` too (the editor is styled with Tailwind classes); the preview needs no Tailwind.
- Store the editor's `value` (`StoredBlock[]`) as it is. To change it from outside, assign a new array (an in-place change is not picked up); a read-only editor never writes it. Built-in types start with `md:`; any other `type` is a plugin's. Never rename a plugin's `type`: stored documents refer to it.
- Pass the same `plugins` to the `Editor` and the `Preview` of a document type. Restrict what an editor offers with `palette` (palette ids: `md:*` kinds and plugin types), not by dropping plugins.
- The editor's colours come from the `@atom-forge/ui` theme tokens (light/dark follow the host). Its block handles sit ~22 px left of its box: leave that much left padding around it.
- No app-specific editor props: app data reaches plugins through contexts (`provideView`, `provideCodeLanguages`, `messages` / `provideText`), plugin fields, or the app's own modules and contexts.
- No image concept: no image field, picker or media list. An image block is an app plugin that stores what the app chooses (a URL, or an id of its own media library), picks it in its view or the app's own dialog, and resolves ids with the app's own data.
- Plugin props are untrusted user input. Previews sanitize: `safeColor` for colours, check links and image addresses (`http(s)` or site-relative), clamp numbers, never `{@html}` with props.
- A plugin view declares both `props` and `blocks` with `$bindable()`, even if unused.
- Containers (`content: 'blocks'`) nest one level only; nested editors never offer containers or unique plugins. `accepts` narrows their content (`'md:*'` = every built-in).
- `unique`: one per document, top level; not enforced by the schema.
- `toMarkdown` and `toStored` use the DOM: browser only. `fromMarkdown`, `fromStored`, `inline`, the schema and `./model` run anywhere.
- Validate saved documents on the server with `blocksSchemaFor(plugins)`; it checks shape and `accepts`, not known types, uniqueness or prop contents.
- Scroll sync is proportional (same scroll fraction), one way, editor → preview; it needs no markup and shows roughly the same place, not the same block.
- `<Preview>` is optional: the editor doesn't depend on it. An app with its own renderer can render `StoredBlock[]` itself and omit plugin `preview`s; bundled plugins ship a default preview you may use, replace (`{ ...youtube, preview: Mine }`) or ignore.
- UI text: English source text is the key; pass `messages` (e.g. `hu` from `@atom-forge/brickee/locales/hu`, extended with your own keys) to the top editor/preview.

## Public API

```ts
// @atom-forge/brickee — components
// <Editor bind:value={StoredBlock[]} plugins?={BlockPlugin[]} palette?={string[]} messages?={Messages}
//         readonly?={boolean} placeholder?={string} />   // `nested` is for Frame only
// <Preview blocks={StoredBlock[]} plugins={BlockPlugin[]} messages?={Messages}
//          inlinePlugins?={InlinePlugin[]} nested?={boolean} />
// <Frame bind:blocks {readonly} {palette} {plugins} heading?={string} empty?={string} image?={string} placeholder?={string} />
// <Empty icon={Icon} text={string} />

interface StoredBlock { type: string; indent: number; text?: string; props?: Record<string, unknown>; blocks?: StoredBlock[] }
const MD = 'md:'; const MAX_INDENT = 6; const MAX_DEPTH = 2;
function isMd(b: StoredBlock): boolean;
function acceptsId(accepts: readonly string[] | undefined, id: string): boolean;
function inlineToPlainText(md: string): string;
function blocksToPlainText(blocks: StoredBlock[]): string;

// markdown (Block = the editor's working form: { id, type, html, indent, checked?, props?, plugin?, blocks? })
function inline(md: string): string;                 // inline markdown -> safe inline HTML
function fromStored(s: StoredBlock): Block;
function toStored(b: Block): StoredBlock;           // browser only
function fromMarkdown(src: string, opts?: { plugins?: BlockPlugin[] }): Block[]; // CommonMark/GFM blocks; a paragraph's lines stay one block; a GFM table goes to the first plugin with fromTable
function fromHtml(html: string, opts?: { plugins?: BlockPlugin[] }): Block[]; // browser only; formatted paste (web, Google Docs, Word) via markdown
function toMarkdown(blocks: Block[], opts?: { plugins?: BlockPlugin[] }): string; // browser only

// contexts (call provide* in component init, above the editor/preview; use* in plugin components)
function provideView(get: () => string | undefined): void;
function useView(): () => string | undefined;
interface CodeLanguage { value: string; label?: string }      // value: stored as the code block's props.lang
function provideCodeLanguages(own: () => (string | CodeLanguage)[] | undefined): void; // list: the language field is a dropdown
function useCodeLanguages(): () => CodeLanguage[];             // empty: free text
type Messages = Record<string, string>;
type Translate = (text: string, vars?: Record<string, string | number>) => string; // fills {name}
function provideText(own: () => Messages | undefined): void;
function useText(): Translate;
function translator(messages?: Messages): Translate;

// scroll sync (editor -> preview, by scroll fraction)
interface ScrollSync {
	source: Action<HTMLElement>;                     // use:sync.source on the editor's scrolling box
	target: Action<HTMLElement, boolean | undefined>; // use:sync.target={on} on the preview's (default on)
	align(): void;                                   // re-sync now (e.g. after the preview width changed)
}
function scrollSync(): ScrollSync;
function scrollFraction(box: HTMLElement): number;            // 0…1 (0 if it does not scroll)
function setScrollFraction(box: HTMLElement, f: number): void;

// palette
interface PaletteItem { id: string; label: string; hint: string; keys: string; icon: Icon }
const PALETTE_ITEMS: PaletteItem[]; const BUILT_IN_IDS: string[];
function narrowPalette(palette: string[], accepts: readonly string[] | undefined): string[];

// kit helpers
function safeColor(c: unknown, fallback: string): string;   // #hex (3–8 digits) or fallback
function lines(s: string): string[];                        // trimmed non-empty lines
function baseValue(v: unknown): unknown;                    // base of a per-view prop
function viewValues(v: unknown, keys: string[]): unknown[]; // per-view prop, inheritance applied
function mdText(s: unknown): string;                        // plain text safe in markdown
function mdJoin(...parts: (string | false | null | undefined)[]): string; // blank-line join, empties dropped
function mdQuote(md: string): string;                       // '> ' every line

// plugins
interface BlockPlugin<P extends Props = Props> {
	type: string;                // not 'md:'; schema: /^[a-z][a-z0-9:-]{0,39}$/
	label: string; hint: string; keys: string; icon: Icon;
	props: () => P;              // a new block's props
	fields?: PropField[];
	tag(props: P): string;       // mini label; ' · ' parts translated separately
	content: 'none' | 'text' | 'plain' | 'blocks'; // plugins use 'none' or 'blocks'
	view: Component<PluginViewProps<any>, {}, 'props' | 'blocks'>;
	preview?: Component<PluginPreviewProps<any>>; // optional: without it <Preview> renders nothing for the block
	accepts?: string[];          // container content as palette ids; 'md:*'
	markdown?(props: P, ctx: MarkdownContext): string; // '' = left out
	fromTable?(table: MarkdownTable): P; // takes a pasted/imported GFM table (bundled `table` does)
	fromFiles?(files: File[]): P | null | Promise<P | null>; // takes pasted/dropped files; null = next plugin; upload is yours
	unique?: boolean;
}
interface PluginViewProps<P> { props: P; blocks: StoredBlock[]; readonly: boolean; palette: string[]; plugins: BlockPlugin[] }
interface PluginPreviewProps<P> { props: P; blocks: StoredBlock[]; plugins: BlockPlugin[] }
interface MarkdownContext { inner: string }
interface MarkdownTable { rows: string[][] /* inline markdown, first row = header */; align: ('left' | 'center' | 'right')[] }
interface PropField {
	key: string; label: string;
	kind: 'text' | 'textarea' | 'color' | 'select' | 'slider' | 'toggles'; // toggles: icon buttons, stores the list of the ones on
	placeholder?: string;
	options?: { value: string; label: string; icon?: Icon }[]; // select; stepped slider (label may use {n}); toggles (icon + tooltip)
	min?: number; max?: number; step?: number; unit?: string; // number slider (stored as string)
	none?: string;                                // unset label (number slider notch, optional colour)
	views?: { key: string; label: string }[];     // per-view slider values
	format?: (value: unknown) => string;
	parse?: (text: string) => unknown;            // '' / null removes the key
}

// @atom-forge/brickee/plugins
// table, youtube, map, gap — the only bundled plugins (none holds nested blocks or images); PLUGINS = [table, youtube, map, gap]
// types: TableProps, YouTubeProps, MapProps, GapProps, Head
// helpers: youtubeId, mapSrc, gapLines, GAP_LINES, GAP_MAX, tableHeads, rowHead, HEADS, square
// Image blocks, boxes and other containers are app plugins you write yourself (see docs/en/writing-plugins.md).

// inline plugins: elements inside the text (stored as their markdown form, e.g. `$x^2$`); same list to Editor and Preview
interface InlinePlugin<D extends Record<string, string>> { type: string; label: string; icon: Icon; pattern: RegExp /* global, bounded */;
	parse(match: string[]): D; markdown(data: D): string; render(data: D): string /* safe HTML */; fields: PropField[]; create(text: string): D; typing?: { open: string; close: string } }
function useInlinePlugins(): () => InlinePlugin[]; // in plugin views (e.g. rendering cells with inline())
function inline(md: string, opts?: { inlinePlugins?: InlinePlugin[] }): string;

// @atom-forge/brickee/math (needs `temml`, optional peer): math (block, `$$…$$`, fromMath), inlineMath (`$…$`), tex(source, display)

// @atom-forge/brickee/schema (zod)
const blocksSchema: ZodType<StoredBlock[]>;
function blocksSchemaFor(plugins: readonly { type: string; accepts?: readonly string[] }[]): ZodType<StoredBlock[]>;

// @atom-forge/brickee/model — StoredBlock, MD, MAX_INDENT, MAX_DEPTH, isMd, acceptsId, inlineToPlainText, blocksToPlainText
// @atom-forge/brickee/locales/hu — hu: Messages
```

## Minimal example

```svelte
<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { hu } from '@atom-forge/brickee/locales/hu';

	let value = $state<StoredBlock[]>([]);
</script>

<Editor bind:value plugins={PLUGINS} messages={hu} />
<Preview blocks={value} plugins={PLUGINS} messages={hu} />
```

## Common extensions

**Writing a plugin** — a props interface, a view, a preview, the object:

```svelte
<!-- ButtonView.svelte -->
<script lang="ts" module>
	export interface ButtonProps extends Record<string, unknown> { label: string; url: string; color: string }
</script>
<script lang="ts">
	import { MousePointerClick } from '@lucide/svelte';
	import { Empty, type PluginViewProps } from '@atom-forge/brickee';
	let { props = $bindable(), blocks = $bindable() }: PluginViewProps<ButtonProps> = $props();
</script>
{#if props.label}<span>{props.label}</span>{:else}<Empty icon={MousePointerClick} text="Set the label and the link above" />{/if}
```

```svelte
<!-- ButtonPreview.svelte -->
<script lang="ts">
	import { safeColor, type PluginPreviewProps } from '@atom-forge/brickee';
	import type { ButtonProps } from './ButtonView.svelte';
	let { props }: PluginPreviewProps<ButtonProps> = $props();
	const href = $derived(/^(https?:|mailto:|\/(?!\/))/.test(String(props.url ?? '')) ? String(props.url) : '');
</script>
{#if href && props.label}<a {href} style:background={safeColor(props.color, '#2563eb')}>{props.label}</a>{/if}
```

```ts
// button.ts
import { MousePointerClick } from '@lucide/svelte';
import { mdText, type BlockPlugin } from '@atom-forge/brickee';
import ButtonView, { type ButtonProps } from './ButtonView.svelte';
import ButtonPreview from './ButtonPreview.svelte';

export const button: BlockPlugin<ButtonProps> = {
	type: 'button', label: 'Button', hint: 'A link as a button', keys: 'button link cta', icon: MousePointerClick,
	props: () => ({ label: '', url: '', color: '#2563eb' }),
	fields: [
		{ key: 'label', label: 'Label', kind: 'text' },
		{ key: 'url', label: 'Link', kind: 'text', placeholder: 'https://…' },
		{ key: 'color', label: 'Colour', kind: 'color' }
	],
	tag: () => 'button',
	content: 'none',
	markdown: (p) => (p.url ? `[${mdText(p.label)}](${p.url})` : ''),
	view: ButtonView,
	preview: ButtonPreview
};
```

A **container** uses `content: 'blocks'`, `accepts`, `<Frame bind:blocks {readonly} {palette} {plugins} />` in its view and `<Preview {blocks} {plugins} nested />` in its preview; its `markdown` gets the inner blocks as `ctx.inner` (`mdQuote(mdJoin(title, inner))`).

**Overriding a preview / adding fields** — spread the plugin, keep `type`:

```ts
import type { BlockPlugin } from '@atom-forge/brickee';
import { map, youtube } from '@atom-forge/brickee/plugins';
import SiteYouTube from './SiteYouTube.svelte'; // receives PluginPreviewProps<YouTubeProps>
import SiteMap from './SiteMap.svelte';

export const plugins: BlockPlugin[] = [
	{ ...youtube, preview: SiteYouTube },
	{
		...map,
		props: () => ({ ...map.props(), caption: '' }),
		fields: [...(map.fields ?? []), { key: 'caption', label: 'Caption', kind: 'text' }],
		preview: SiteMap
	}
];
```

**Markdown form and conversion** — `markdown(props, { inner })` returns markdown or `''`; use `mdText`, `mdJoin`, `mdQuote`. Whole document: `toMarkdown(doc.map(fromStored), { plugins })`; import: `fromMarkdown(text).map(toStored)` (both in the browser).

**Per-view fields** — add `views` to a slider field and provide the current view:

```ts
import type { BlockPlugin } from '@atom-forge/brickee';

const VIEWS = [{ key: 'desktop', label: 'Desktop' }, { key: 'phone', label: 'Phone' }];
const perView = (p: BlockPlugin, key: string): BlockPlugin => ({ ...p, fields: p.fields?.map((f) => (f.key === key ? { ...f, views: VIEWS } : f)) });
// host component around <Editor>: provideView(() => currentViewKey);
// preview: const [desktop, phone] = viewValues(props.ratio, ['desktop', 'phone']);
```

Stored as the base value alone (`"56"`) or an object by view key (`{ "desktop": "56", "phone": "100" }`); a view without its own value inherits from the view before it.

**Scroll sync (split view)** — one way, editor → preview, same scroll fraction; re-syncs on source scroll and target resize:

```svelte
<script lang="ts">
	import { Editor, Preview, scrollSync, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	let value = $state<StoredBlock[]>([]);
	const sync = scrollSync();
</script>
<div style="overflow-y: auto; height: 100vh" use:sync.source><Editor bind:value plugins={PLUGINS} /></div>
<div style="overflow-y: auto; height: 100vh" use:sync.target><Preview blocks={value} plugins={PLUGINS} /></div>
```

Keep the place across a layout change: `const f = scrollFraction(box); change(); await tick(); setScrollFraction(box, f);`.

**Server validation**:

```ts
import { blocksSchemaFor } from '@atom-forge/brickee/schema';
const result = blocksSchemaFor(plugins).safeParse(input); // or pass [{ type, accepts }] only
```

## Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Fields and popups unstyled | `@atom-forge/ui` theme CSS / `@source` missing | Set up `@atom-forge/ui`; render beneath its `Root`. |
| Editor rows, menus or table unstyled / shrunk | `@atom-forge/brickee/dist` not a Tailwind `@source` | `@source "../node_modules/@atom-forge/brickee/dist";` |
| Block handles stick out on the left | Handles are drawn ~22 px left of the editor's box | Give the editor's container ~22 px left padding. |
| Context errors with a linked local copy | Duplicate `svelte` / `@atom-forge/ui` | Vite `resolve.dedupe: ['svelte', '@atom-forge/ui', '@lucide/svelte', 'zod']`. |
| A block is missing from `<Preview>` | Its plugin has no `preview` | Add one (bundled plugins have a default) or render it yourself. |
| "Unknown block" in the editor, block missing on the site | Plugin missing from `plugins` | Same plugins for editor and preview. |
| Image block renders nothing | Preview rejects the stored address, or the app's lookup lacks the id | Store `http(s)` / site-relative addresses; resolve ids from the same app data everywhere. |
| `media` prop, `useMedia`, `findMedia`, `kind: 'image'` missing | Removed: images are the app's business | Own picking and lookup in the app's image plugin (see `docs/en/upgrading.md`). |
| Box not offered inside a box | One nesting level | By design. |
| Block not offered inside a container | `accepts` or host `palette` excludes it | Add its palette id (or `'md:*'`). |
| `document is not defined` | `toMarkdown` / `toStored` during SSR | Call in the browser. |
| Injected colour / link | Props rendered unchecked | `safeColor`, link checks, no `{@html}`. |
| Override loses its blocks | `type` changed | Keep `type`. |
| Bind error in a custom view | `props` / `blocks` not `$bindable()` | Declare both bindable. |
| Value is never `[]` after mount | An empty document is one empty paragraph | Test emptiness with `blocksToPlainText(doc).trim() === ''`. |
| Preview does not follow the editor | Actions not on the scrolling boxes | Put them on the `overflow` boxes. |
| `image`, `callout`, `locked`… not exported from `/plugins` | Only `table`, `youtube`, `map`, `gap` are bundled | Keep app-owned copies with the same `type` (see `docs/en/upgrading.md`). |
| `safeColor` import fails from `/plugins` | Kit helpers live in the core | Import from `@atom-forge/brickee`. |

## Documentation map

In the installed package (`node_modules/@atom-forge/brickee/`):

- [`docs/en/index.md`](docs/en/index.md) — full English documentation, one page per chapter: [getting started](docs/en/getting-started.md), [editor and preview](docs/en/editor-and-preview.md), [documents and markdown](docs/en/documents-and-markdown.md), [bundled plugins](docs/en/bundled-plugins.md), [writing plugins](docs/en/writing-plugins.md), [host contexts](docs/en/host-contexts.md), [on the server](docs/en/server-side.md), [recipes and pitfalls](docs/en/recipes-and-pitfalls.md), [upgrading](docs/en/upgrading.md). Authoritative.
- [`docs/hu/index.md`](docs/hu/index.md) — Hungarian translation.
- [`CHANGELOG.md`](CHANGELOG.md) — release history.
- `dist/index.d.ts`, `dist/plugins/index.d.ts` — the exported types of the installed version; `dist/plugins/` — the bundled plugins' source, useful as plugin examples.

The book at https://books.atom-forge.eu is the source of these docs and adds the AI Notes chapter: instructions to copy into your project's agent instruction file. To develop the package itself, follow `AGENTS.md` in the repository.
