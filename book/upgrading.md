---
type: chapter
---
# Upgrading

This chapter lists the changes that may require action when you move to a newer version of `@atom-forge/brickee`. Each section covers one version step, newest first, and each change ends with a **What to do:** paragraph.

Changes that need no action from you — new exports, fixes, documentation updates — are listed only in the changelog (`CHANGELOG.md`, shipped with the package).

## From 0.0.2 to 0.0.3

### The editor needs its `dist` folder as a Tailwind `@source`

The editor's own styles moved from scoped CSS to Tailwind classes (with the `@atom-forge/ui` theme's colours) and SCSS. Tailwind 4 does not look into `node_modules`, so without a `@source` for the package the editor's rows, menus, fields bar and table lose their look. The preview is unaffected: its styles still travel with its markup.

**What to do:** in the CSS file where you set up `@atom-forge/ui`, add `@source "../node_modules/@atom-forge/brickee/dist";` (with the path from that file) beside the `@atom-forge/ui` one. Nothing changes for pages that only show the `Preview`.

### Gate blocks are gone

Gating content (a supporters-only or paywall divider) is an application's concept, not the editor's. `BlockPlugin.gate`, the `Preview`'s `markGated` prop, its "For supporters only" section with the `.supporters` and `.supporters-label` classes, and the `For supporters only` text of the Hungarian locale are removed. The `Preview` now renders every block it gets. `unique` stays.

**What to do:** remove `gate: true` from your plugin and `markGated` from your previews. Your divider stays an ordinary (unique) plugin block, so stored documents still load. Where you showed the gated part marked, render the document in two parts yourself — `const at = doc.findIndex((b) => b.type === 'divider')`, then `doc.slice(0, at + 1)` and `doc.slice(at + 1)` in two `<Preview>`s inside your own markup — and keep cutting the gated part for readers without access before it reaches the page. Add your own translation for any label you show.

## From 0.0.1 to 0.0.2

### Images and media are no longer part of the package

The package has no notion of images any more. Whether a block stores an image's URL or an id, how the user picks the image, and how the stored value becomes an address are decided by the application's own image plugin (see [[writing-plugins#Images|Images]]).

| Removed | Was |
|---|---|
| `kind: 'image'`, `kind: 'images'` | Field kinds that stored the id (or ids) of a picked media item, with the built-in image picker popup |
| `media` prop of `Editor` and `Preview` | The images blocks could pick from and refer to |
| `provideMedia`, `useMedia`, `findMedia`, `MediaItem` | The media context, its lookup and its type |
| `media` option of `toMarkdown` | `toMarkdown(blocks, { plugins, media })` is now `toMarkdown(blocks, { plugins })` |
| `ctx.media` in a plugin's `markdown(props, ctx)` | `MarkdownContext` is now `{ inner }` |

`PropField['kind']` is now `'text' | 'textarea' | 'color' | 'select' | 'slider'`. Stored documents are unaffected: a block's props keep whatever they stored, ids included.

**What to do:** in your image plugins, replace each `image` or `images` field with your own picking — a button in the plugin's view that opens your media dialog or an upload and writes the result into `props`, or a plain `text` field for a URL — and keep the prop keys, so stored documents still load. Remove the `media` prop from your editors and previews, and the `media` option from your `toMarkdown` calls. Where a view, a preview or a `markdown` form turned an id into an address with `useMedia`, `findMedia` or `ctx.media`, look it up in your application's own data instead: a module of your app, or a Svelte context of your own provided above the editor and the preview (`markdown` runs outside components, so it needs module data). Define a `MediaItem`-like type in your app if you still need one.

## From the `block-editor` workspace package to 0.0.1

This section is only for applications that used the editor before it became this package.

The editor started as `block-editor`, a workspace package inside an application. It moved here as `@atom-forge/brickee` with the same stored form, so saved documents need no conversion. The import specifiers changed, the plugin kit moved from the plugins entry point into the core, and the site-specific plugins stayed with the application.

### Package name and entry points

| Before | After |
|---|---|
| `block-editor` | `@atom-forge/brickee` |
| `block-editor/plugins` | `@atom-forge/brickee/plugins` |
| `block-editor/locales/hu` | `@atom-forge/brickee/locales/hu` |

**What to do:** replace the dependency (`"block-editor": "workspace:*"` → `"@atom-forge/brickee"`) and rename the imports. Install `@atom-forge/ui` and `@lucide/svelte` as dependencies of the application if they are not already, and `zod` if you use the schema.

### The kit lives in the core

`Frame`, `Empty` and the plugin helpers are exported from the core entry point. `safeColor`, `viewValues`, `baseValue` and `lines` are no longer exported from the plugins entry point.

```ts
// Before
import { safeColor, viewValues } from 'block-editor/plugins';

// After
import { safeColor, viewValues } from '@atom-forge/brickee';
```

**What to do:** import `Frame`, `Empty`, `safeColor`, `viewValues`, `baseValue`, `lines`, `mdText`, `mdJoin` and `mdQuote` from `@atom-forge/brickee`. The helpers of the bundled plugins that remain (`youtubeId`, `mapSrc`, `gapLines`, `tableHeads`…) stay in `@atom-forge/brickee/plugins`.

### Site-specific plugins are no longer in the package

The package now bundles only four general-purpose plugins: `table`, `youtube`, `map` and `gap` (`PLUGINS` holds these four). The other plugins of `block-editor/plugins` and their helpers were application-specific and are not part of `@atom-forge/brickee`:

| Removed | Kind |
|---|---|
| `richBox`, `feature`, `sideBox`, `callout`, `spoiler`, `faq`, `imageText` | container plugins |
| `image`, `gallery`, `tweet`, `form`, `banner`, `locked` | plugins |
| `CALLOUTS`, `calloutTone`, `CalloutTone`, `questions`, `formEmbed`, `formHeight` | their helpers |
| `postId`, `userName`, `RATIO_MIN`, `RATIO_MAX`, `ratioPercent`, `ratio` | helpers of the former `plugins/util` |
| `ImageProps`, `GalleryProps`, `CalloutProps` and the other props types of these plugins | types |

The stored form is unchanged: documents that contain these block types stay valid, as long as the application still passes plugins with the same `type` values to the editor and the preview.

**What to do:** if the application uses any of these plugins, keep its own copy of them (their views, previews and helpers) in the application, written against the core kit, and add them to its plugin list with the same `type`. Import the four remaining plugins and their helpers from `@atom-forge/brickee/plugins` as before. Add the UI text of the copied plugins to your `messages`: `@atom-forge/brickee/locales/hu` no longer contains it.
