---
type: chapter
---
# AI Notes

A coding agent works best when it reads the documentation of the package first and knows the decisions your project has already made. Copy the fenced block below into the instruction file of your project (for example `AGENTS.md`) and replace every `<...>` field with a fact you have verified in your application.

## Purpose

Keep block content consistent: one place for the plugins, palettes and UI text, the same plugins for the editor and the site, safe previews, and server-side validation of every saved document.

## Copyable instructions

````markdown
## Brickee block editor

Before using `@atom-forge/brickee`, start with
`node_modules/@atom-forge/brickee/README-AI.md` at the package root, then follow
its documentation pointers (`docs/en/`). Follow dependency symlinks to the
library repository when present and use documentation matching the installed
version. This is a filesystem Markdown path, not a package import subpath.

Project decisions:

- Block setup module (plugins, palettes, messages): `<path, e.g. src/lib/blocks/plugins.ts>`
- Editor wrapper component: `<path, e.g. src/lib/blocks/BlockEditor.svelte>`
- Site previews that replace bundled ones: `<folder, e.g. src/lib/blocks/site/>`
- Where documents are validated on the server: `<file>`
- App data the project's plugins use, and where it comes from: `<e.g. images: ids of the page's attachments, from src/lib/media.ts; the album: an app context>`
- UI language and messages: `<e.g. Hungarian: locales/hu extended in the setup module>`

Rules:

- Store documents as `StoredBlock[]` JSON exactly as the editor writes them.
  Built-in blocks are `md:*`; every other `type` is a plugin's.
- Add, adapt or remove blocks only in the block setup module. Override a bundled
  plugin with a spread (`{ ...youtube, preview: SiteYouTube }`); never change its
  `type`, which stored documents refer to.
- Use the same plugin list for the editor and the site preview of a document
  type. Restrict what an editor offers with `palette`, not by dropping plugins.
- Write new plugins with the core kit only (`Frame`, `Empty`, `safeColor`,
  `lines`, `mdText`, `mdJoin`, `mdQuote`, `useText`). Declare a view's `props` and `blocks` with `$bindable()`.
- Settings the generated `fields` cannot express go in the plugin's own `form`
  component (fields bar); assign a new `props` object there (one undo step).
- Treat plugin props as untrusted user input in previews: colours through
  `safeColor`, links and image addresses checked, numbers clamped. Never
  render props with `{@html}`.
- The package has no notion of the project's data (images, media, users,
  screen widths). The project's plugins read it from the project's own modules
  and contexts, and resolve stored ids the same way in view, preview and
  `markdown`.
- Containers go one level deep; narrow their content with `accepts`.
- Validate every saved document on the server with `blocksSchemaFor(plugins)`
  from `@atom-forge/brickee/schema`, plus the project's own refinements.
- App needs reach plugins through `provideCodeLanguages`, `messages`, plugin
  fields and forms, or the project's own modules and contexts, never through
  new editor props.
- Put the English text of new labels, hints, keys and field labels into the
  project's messages.
- `toMarkdown` and `toStored` need the browser; do not call them during SSR.
````

## Usage

Fill in the project decisions once, when the editor is first set up, and keep them current when the setup moves. The rules restate the package's contracts; they do not require restructuring an existing setup that already follows them.
