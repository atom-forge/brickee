# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A plugin's own fields form: the new optional `BlockPlugin.form`, any Svelte component shown in the block's fields bar below the generated fields (or alone), with the block's props bound (`PluginFormProps`: `props`, `readonly`); assigning a new props object is one edit with its own undo step. For what the generated fields cannot do: the app's own pickers, data, contexts and scripts. Documented in *Writing plugins → Custom fields form*.
- Showcase: a *Custom fields form* page (a photo block whose form picks from the album an app context names, with its own upload), replacing the *Image blocks* page.
- Inline plugins: elements inside a block's text (a formula, a mention…) that move and delete as one while the stored text stays inline markdown. `InlinePlugin` (pattern, parse, markdown, render, fields, create, typing), the `inlinePlugins` prop of `Editor` and `Preview` (inherited by nested editors; `useInlinePlugins()` / `provideInlinePlugins()` for plugin views), and `inline(md, { inlinePlugins })`. The toolbar gets a button per inline plugin, a click opens an element's fields, typing its markers makes one.
- `inlineMath` in `@atom-forge/brickee/math`: a formula inside the text, `$…$` (the GitHub and Obsidian rule, so prices stay text).
- Inline markdown while typing: `**bold**`, `*italic*` / `_italic_` and `~~strike~~` turn into their mark when a space, a punctuation mark or Enter follows; `` `code` `` on its closing backtick, `[text](url)` on its closing parenthesis. A `*` or `_` opens only at a word's edge (`2*3*4`, `snake_case` stay text); `Ctrl/Cmd+Z` right after brings back the text as typed.
- A formula block: `math` in the new entry point `@atom-forge/brickee/math`, written in LaTeX and drawn as MathML by `temml` (an optional peer dependency; it also renders on the server). Its markdown form is a `$$…$$` block, and a pasted or imported one becomes a formula through the new optional `BlockPlugin.fromMath(tex)`.
- Plan for formulas and inline plugins in `notes/` (not shipped), linked from `TODO.md`.

### Removed

- **Breaking:** per-view field values. `PropField.views`, `provideView` / `useView`, the kit helpers `baseValue` and `viewValues`, the fields bar's view badge and "inherited" mark, and the `inherited` text of the Hungarian locale are gone: which views a page has is the app's concept, handled in its own plugin (a `form` and its own context). Stored per-view objects still load. The *Per-view values* docs section and showcase page are removed; *Host contexts* now covers code languages and UI text only. See the upgrading chapter.
- The image-specific docs section (*Writing plugins → Images*) and the image rules of `README-AI.md` and AI Notes: images are an ordinary app plugin, now shown through the custom fields form example.

### Changed

- A `$` typed as text is stored escaped (`\$`), so it never turns into a formula of an inline plugin later.

## [0.0.3] - 2026-11-11

### Added

- Table cells show their text formatted (bold, italic, code, links…) while they are not edited, instead of the raw markdown; while editing, `Ctrl/Cmd` + `B`, `I`, `E`, `Shift+X` and `K` wrap the selected text in the mark (a link with its address selected to type over).
- Touch and keyboard: *Move up* / *Move down* in the Turn-into menu (moving without dragging); the Turn-into menu opens from the keyboard (`/`, `Ctrl/Cmd+/`, the menu key or `Shift+F10` on selected blocks, `Ctrl/Cmd+/` in a block's text); on a touch screen a tapped block shows its actions beside its handle; the handle is a button (with a label for screen readers) and its actions also show on focus.
- Files pasted into the editor or dropped on it from outside the page go to a plugin that takes them: the new optional `BlockPlugin.fromFiles(files)` returns the block's props (or a promise of them, after its own upload) or `null` for the next plugin. A drop line shows where a dropped file lands; the step is undoable.
- Formatted paste: text pasted from a web page, Google Docs or Word keeps its headings, paragraphs, lists (nested, numbered, to-dos), quotes, code, rules, tables (for a plugin that takes them) and inline marks, instead of arriving as plain text. Exported as `fromHtml(html, { plugins })` (browser only); it reads the HTML through markdown, so the result is as safe as any other text.
- Pasting or importing a GFM table: `fromMarkdown(text, { plugins })` gives it to the first plugin with the new `BlockPlugin.fromTable(table: MarkdownTable)`, which returns the block's props; the bundled `table` takes them, so a table pasted into an editor that offers it becomes a table block.
- A numbered list keeps its start number (`props.start` on its first `md:ol` item): read from markdown (`5. …`), numbered from it in the editor and the preview (`<ol start>`), and written back.
- Tests for the markdown conversions (`bun run test`, vitest), run by the release checks, the publish workflow and a new test workflow on every push and pull request (type check, tests, package).
- Code review findings and a staged fix plan in `notes/` (not shipped), linked from `TODO.md`.
- Development tools (not shipped): `scripts/shots.mjs` and `scripts/shots-diff.mjs` photograph the editor's looks in light and dark mode from the dev pages (`/dev/states`, `/dev/perf`) and compare two sets pixel by pixel; `<style lang="scss">` is enabled (compiled at build time, so `dist/` holds plain CSS).

### Changed

- The undo history shares unchanged blocks between its steps: a step costs only the blocks that changed, not a copy of the whole document (in a 2000-block document about 320 KB a step before, 300 steps kept).
- The editor's accent (selection, active menu row, checked to-do, links, the focused table cell, the toggles) follows the `@atom-forge/ui` theme's accent colour instead of a fixed blue (blue remains the fallback), and the editor and the table use the page's typeface (the editor keeps its 17px size), so they read like the preview beside them.
- **Breaking:** the editor is styled with Tailwind classes (with the `@atom-forge/ui` theme's colours) and SCSS instead of scoped CSS, so a host must add the package's `dist` folder as a Tailwind `@source`, like the `@atom-forge/ui` one; otherwise the editor loses its look. The preview is unaffected (its styles still travel with its markup). The slash and turn-into menus and the formatting bar are their own components, and the undo history its own class. See the upgrading chapter.
- The editor's internal context keys are `brickee:*` (were `block-editor:*`); an "Unknown block" note is translatable (`Unknown block: {type}`, also in the Hungarian locale).
- `fromMarkdown` reads much more of CommonMark and GFM: fences of any length and `~~~` (closed only by a fence at least as long), indented code, setext headings and closing `#`s, nested quotes, list nesting by the items' markers (also under `1. ` and with four-space indents), reference links, footnotes (as superscripts), and the lines of a paragraph, list item or quote as one block with line breaks instead of one block per line.
- `inline` reads `_italic_`, `__bold__` and `***both***` (now valid HTML), code spans of any backtick length, link targets with balanced parentheses and titles, `<https://…>` autolinks, images (as links), every ASCII punctuation escape, and inline HTML (marks kept, other tags dropped). A stored text with a word wrapped in single underscores (`_word_`) now shows it in italics.
- Typing converts only the edited block to its stored form: the other blocks keep their objects in `value`, so the editor and a `<Preview>` beside it do much less work per keystroke (a 2000-block document with a preview: about 50 ms → 33 ms per keystroke). A document from outside is reloaded when `value` is replaced with a new array that differs from the current one; changing the array in place is not picked up.
- `toMarkdown` writes markdown other readers read the same way: items nested under a numbered item indented to its content, code fenced longer than any backtick run in it, consecutive quotes as one quote, line breaks as a backslash at the line's end, `_` and line starts that would read as markup escaped.

### Removed

- **Breaking:** gate blocks — gating content is the application's concept, not the editor's. Removed: `BlockPlugin.gate`, the `Preview`'s `markGated` prop and its "For supporters only" section (`.supporters`, `.supporters-label`), and that text in the Hungarian locale; the `Preview` renders every block. `unique` stays. See the upgrading chapter.

### Fixed

- The slash menu, the turn-into menu, the formatting bar and the link prompt open where they belong when the editor sits in a transformed parent (an animated drawer or dialog); they live in the body now, placed against the viewport.
- The table block fills the width of the editor on pages that use Tailwind: its root's class `table` collided with Tailwind's `table` utility (`display: table`), which shrank it to its content.
- A server-rendered editor shows its blocks' text (it was empty until the page's script ran, so a read-only editor showed nothing without JavaScript). A test renders the editor and the preview on the server, and the test workflow builds the showcase site (which prerenders every page).
- An editor or a table removed in the middle of a block sweep, a drag or typing leaves no window listener or timer behind.
- Copying and pasting blocks keeps plugin blocks: the clipboard carries the blocks themselves (`application/x-brickee+json`) beside their markdown, so a copied video, table, gap or box is pasted back as that block instead of a link or nothing; an editor that does not offer the plugin (or already has a unique one) gets its markdown form. An empty block takes pasted plugin blocks in its place, and pasting while blocks are selected inserts after them.
- Changes made in a plugin's view are undoable: table cells, rows and columns, and the blocks of a nested editor (a box) are undo steps of the editor around them, and Ctrl+Z / Ctrl+Shift+Z in a table cell undo and redo there instead of the cell's own short-lived history. A document loaded from outside starts a fresh history.
- A read-only editor no longer writes its normalized document back into `value` on mount, so a host does not see a change nobody made.
- Inline markdown and `fromMarkdown` stay fast on hostile text: many unclosed HTML tags, a long run of `[`, unclosed `**` or `_`, or long runs of spaces could freeze the tab for seconds to minutes; every pattern is now linear (100 000 characters take milliseconds). Limits that come with it: a marked span is at most 2000 characters, a link label has no brackets of its own (at most 1000 characters), a link target at most 2000. Inline HTML marks are now always balanced (an unclosed `<b>` is closed, a stray closing tag dropped).

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
