# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Releases are configured with `ship-it init`: the publish workflow comes from Ship's template, `package.json` gains `pub-validate` and `publishConfig`, and npm Trusted Publishing lets CI publish the next versions.

## [0.0.1] - 2026-11-10

### Added

- The block editor, moved here from the gamer365 project (where it was the `block-editor` workspace package), as `@atom-forge/brickee`: the markdown core with the editor, the preview, the JSON stored form and the markdown conversions; the kit for writing plugins (`Frame`, `Empty`, block fields, media / view / text contexts, helpers); the bundled plugins in `@atom-forge/brickee/plugins` (general blocks only: YouTube, map, table, gap — the app-specific ones, such as boxes, callouts, images and the supporters-only divider, stay in the app that gave them their meaning); the zod schema in `@atom-forge/brickee/schema`; the Hungarian UI text in `@atom-forge/brickee/locales/hu`.
- `BlockPlugin.preview` is optional: an app with its own renderer leaves it out, and `<Preview>` skips such blocks. The bundled plugins keep a default preview, which an app may use or replace.
- An optional markdown form for plugins (`BlockPlugin.markdown`), used by `toMarkdown(blocks, { plugins, media })` and by copying in the editor; the bundled plugins have one where it makes sense (YouTube and map as a link, table as a GFM table).
- Scroll sync: `scrollSync()` keeps a preview box scrolled to the same fraction as the editor's box (one way, also when the preview's content changes size; `use:sync.source` / `use:sync.target`, `align()`), with `scrollFraction` / `setScrollFraction` for keeping a position across a layout change. Proportional only: the two show roughly the same place, not the same block.
- Repository frame following the AtomForge packages: agent instructions, book, English and Hungarian docs, `README-AI.md`, `TODO.md`, `notes/`, and a tag-triggered publish workflow with `@atom-forge/ship` 0.2.0 (installed from npm).

---
