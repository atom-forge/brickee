---
type: chapter
requires: [stored-block, palette]
---
# Bundled plugins

`@atom-forge/brickee/plugins` holds four general-purpose plugins. They are written only with what the core exports to any plugin author, so they double as examples, and you take only the ones you need.

```ts
import { PLUGINS } from '@atom-forge/brickee/plugins'; // all four
import { table, youtube } from '@atom-forge/brickee/plugins'; // or some
```

## The plugins

| Export | `type` | Fields | Markdown form | What it is |
|---|---|---|---|---|
| `table` | `table` | header and footer (the cells are edited in place) | a GFM table (a pasted GFM table becomes one) | Rows and columns of inline-formatted cells; click a cell for its row and column tools (insert, delete, align), drag rows and columns by their grips. The first row can be a header, the last a footer. |
| `youtube` | `youtube` | video link or id, title | a link | A YouTube video, loaded on click; any YouTube link is reduced to the video id. |
| `map` | `map` | place or address, zoom slider | a link | A Google Maps embed of a place or an address. |
| `gap` | `gap` | height slider | none | Empty space between blocks, 1–8 lines high. |

None of them holds nested blocks. Image blocks, boxes and other containers are application-specific in look and behaviour, so the package leaves them to you: [[writing-plugins|Writing plugins]] shows a container, and [[host-contexts|Host contexts]] an image block.

Besides the plugins, the entry point exports their props types (`TableProps`, `YouTubeProps`, `MapProps`, `GapProps`) and the helpers their previews use, which are useful when you write your own previews: `youtubeId` (a video id from any YouTube link), `mapSrc` (the embed address of a place), `gapLines`, `GAP_LINES` and `GAP_MAX`, and `tableHeads`, `rowHead`, `HEADS` and `square` for tables.

## Overriding a preview

A plugin is a plain object, so adapting one is a spread. The most common change is the preview: the editor view stays the package's, and the site renders the block with your own component — so the editor's preview and the published page are exactly the same.

```ts
// blocks.ts
import type { BlockPlugin } from '@atom-forge/brickee';
import { gap, table, youtube } from '@atom-forge/brickee/plugins';
import SiteYouTube from './SiteYouTube.svelte';

const withPreview = (plugin: BlockPlugin, preview: BlockPlugin['preview']): BlockPlugin => ({ ...plugin, preview });

export const plugins: BlockPlugin[] = [withPreview(youtube, SiteYouTube), table, gap];
```

A replacement preview receives the same props as the original (`PluginPreviewProps`: `props`, `blocks`, `plugins`). This one shows a thumbnail that links to the video instead of embedding a player:

```svelte
<!-- SiteYouTube.svelte -->
<script lang="ts">
	import type { PluginPreviewProps } from '@atom-forge/brickee';
	import { youtubeId, type YouTubeProps } from '@atom-forge/brickee/plugins';

	let { props }: PluginPreviewProps<YouTubeProps> = $props();
	// props are user input: keep only a well-formed video id
	const id = $derived(youtubeId(String(props.id ?? '')));
</script>

{#if id.length === 11}
	<a class="video" href="https://www.youtube.com/watch?v={id}" target="_blank" rel="noopener noreferrer">
		<img src="https://img.youtube.com/vi/{id}/hqdefault.jpg" alt={props.title || 'YouTube video'} />
	</a>
{/if}
```

## Adding fields

New settings are new fields and new initial props. The plugin's view does not need to change: the editor draws every field on the top of the block, and your preview reads the new props.

```ts
import type { BlockPlugin } from '@atom-forge/brickee';
import { map } from '@atom-forge/brickee/plugins';
import SiteMap from './SiteMap.svelte';

export const siteMap: BlockPlugin = {
	...map,
	props: () => ({ ...map.props(), caption: '' }),
	fields: [...(map.fields ?? []), { key: 'caption', label: 'Caption', kind: 'text' }],
	preview: SiteMap
};
```

```svelte
<!-- SiteMap.svelte -->
<script lang="ts">
	import type { PluginPreviewProps } from '@atom-forge/brickee';
	import { mapSrc, type MapProps } from '@atom-forge/brickee/plugins';

	let { props }: PluginPreviewProps<MapProps> = $props();
	const src = $derived(mapSrc(props));
</script>

{#if src}
	<figure>
		<iframe title={props.q} {src} loading="lazy"></iframe>
		{#if props.caption}<figcaption>{props.caption}</figcaption>{/if}
	</figure>
{/if}
```

Add the new field labels to your `messages` if the editor is not in English (see [[host-contexts#UI text|UI text]]). To make an existing slider per-view, map over `fields` and add `views` to it (see [[host-contexts#Per-view values|Per-view values]]).

> [!warning] Keep the type
> Keep the plugin's `type` when you override it: stored documents refer to blocks by type. A new `type` makes a new block, and existing documents will not find their blocks.
