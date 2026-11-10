# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.2] - 2026-11-10

### Added

- Showcase site in `src/routes` (`bun run dev`), styled like the `@atom-forge/ui` site: a playground (editor beside its preview, stored JSON and markdown), the guide (editor and preview, split view, markdown, stored form and schema), a page per bundled plugin, writing, nesting and overriding plugins, image blocks, and the host contexts (per-view values, code languages, localisation), each with live examples and their code. It resolves `@atom-forge/brickee` to the local source and prerenders to `build/` (`@sveltejs/adapter-static`); it is not part of the npm package.
- A `toggles` field kind (`PropField`): a row of icon buttons, each switching one of `options` on or off (`options[].icon` is the button, `label` its tooltip), stored as the list of the ones on.
- `provideCodeLanguages(() => list)` (with `useCodeLanguages` and the `CodeLanguage` type): a host context that turns a code block's language field into a dropdown of the given languages, with *None* first; without it the language stays free text. Nested editors inherit the list, and a stored language missing from it stays an option.

### Changed

- The fields bar is more compact: smaller controls and type, text fields show their label as the placeholder (with the field's own placeholder after it), the other fields a short label beside the control.
- The table's header and footer rows are two icon toggles in its fields bar (a `toggles` field), like any plugin field; the toolbar above the table holds only the row and column tools of the cell being edited, and says to click a cell while none is. The info icon with the keyboard hint is gone.
- The editor follows the host's light and dark mode: its colours (block fields, popups, frames, the table editor, the block actions) come from the `@atom-forge/ui` theme tokens with the former colours as fallbacks, and the props bar and the link prompt no longer force the light theme. The previews' table borders, video captions and the gap's stripes are drawn from the text colour.
- A code block's language is edited in the same fields bar as a plugin's (its header shows `code · <language>`), instead of a small input in its corner; read-only, the corner still shows the language.
- The block handles keep 1px free above and below, so the handles of neighbouring blocks do not touch.
- The docs note that the block handles are drawn about 22 px left of the editor's box, so the element around it needs that much left padding.
- Releases are configured with `ship-it init`: the publish workflow comes from Ship's template, `package.json` gains `pub-validate` and `publishConfig`, and npm Trusted Publishing lets CI publish the next versions.

### Removed

- **Breaking:** images and media are no longer the library's concept — whether a block stores a URL or an id, how the user picks an image and how it is resolved is the application's decision. Removed: the `image` and `images` field kinds with their picker, the `media` prop of `Editor` and `Preview`, `provideMedia`, `useMedia`, `findMedia`, the `MediaItem` type, `toMarkdown`'s `media` option and `MarkdownContext.media`. An image block is an app plugin that picks in its own view or dialog and resolves with the app's own data; stored documents are unaffected. See the upgrading chapter.

## [0.0.1] - 2026-11-10

### Added

- The block editor, moved here from the gamer365 project (where it was the `block-editor` workspace package), as `@atom-forge/brickee`: the markdown core with the editor, the preview, the JSON stored form and the markdown conversions; the kit for writing plugins (`Frame`, `Empty`, block fields, media / view / text contexts, helpers); the bundled plugins in `@atom-forge/brickee/plugins` (general blocks only: YouTube, map, table, gap — the app-specific ones, such as boxes, callouts, images and the supporters-only divider, stay in the app that gave them their meaning); the zod schema in `@atom-forge/brickee/schema`; the Hungarian UI text in `@atom-forge/brickee/locales/hu`.
- `BlockPlugin.preview` is optional: an app with its own renderer leaves it out, and `<Preview>` skips such blocks. The bundled plugins keep a default preview, which an app may use or replace.
- An optional markdown form for plugins (`BlockPlugin.markdown`), used by `toMarkdown(blocks, { plugins, media })` and by copying in the editor; the bundled plugins have one where it makes sense (YouTube and map as a link, table as a GFM table).
- Scroll sync: `scrollSync()` keeps a preview box scrolled to the same fraction as the editor's box (one way, also when the preview's content changes size; `use:sync.source` / `use:sync.target`, `align()`), with `scrollFraction` / `setScrollFraction` for keeping a position across a layout change. Proportional only: the two show roughly the same place, not the same block.
- Repository frame following the AtomForge packages: agent instructions, book, English and Hungarian docs, `README-AI.md`, `TODO.md`, `notes/`, and a tag-triggered publish workflow with `@atom-forge/ship` 0.2.0 (installed from npm).

---
