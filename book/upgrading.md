---
type: chapter
---
# Upgrading

This chapter lists the changes that may require action when you move to a newer version of `@atom-forge/brickee`. Each section covers one version step, newest first, and each change ends with a **What to do:** paragraph.

Changes that need no action from you — new exports, fixes, documentation updates — are listed only in the changelog (`CHANGELOG.md`, shipped with the package).

> [!note] No migration needed yet
> `@atom-forge/brickee` has not had a release that requires changes in code using it. The section below is only for applications that used the editor before it became this package.

## From the `block-editor` workspace package to Unreleased

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
