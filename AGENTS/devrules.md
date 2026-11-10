# Development rules

Development rules of this package. Unlike `AGENTS/changelog.md` and `AGENTS/documentation.md`, this file is not shared with other AtomForge packages.

## General

- Keep changes focused and consistent with the existing code style. Edit the sources, never generated output.
- Preserve the public API and its behavior unless a breaking change is explicitly requested. A change that may require action from users is breaking: follow `AGENTS/changelog.md` and the *Upgrading chapter* rules in `AGENTS/documentation.md`.
- A change to the public API or its behavior is also a documentation change: update the documentation in the same task, following `AGENTS/documentation.md`.
- Before finishing, run the checks listed below and report what passed or failed.
- Only commit, push, or publish when asked.

## Layers

- **Core** (`src/lib/`, entry `index.ts`): the markdown blocks, the editor and the preview, the stored form (`model.ts`, `markdown.ts`), the block fields (`PropsBar`, `ImagePicker`, `PluginHost`), the contexts (`media.ts`, `view.ts`, `i18n.ts`) and the kit (`kit/`: `Frame`, `Empty`, `util.ts`). The core never imports a bundled plugin.
- **Bundled plugins** (`src/lib/plugins/`, entry `plugins/index.ts`): written only with what the core exports to any plugin author. Their own helpers stay in `plugins/util.ts`.
- Nothing app-specific belongs in the package. App needs (views, columns, themes) reach plugins through contexts or plugin fields, never through editor props.

## Project

- Showcase site: `src/routes/(site)` (pages, each with live `examples/` shown with their `?raw` code) and `src/site` (the shell copied from the `@atom-forge/ui` site, sample documents, example plugins in `blocks/`). `kit.alias` resolves `@atom-forge/brickee` to `src/lib` and `$site` to `src/site`; `vite build` prerenders it to `build/`. Neither is part of the npm package. Wrap a demo `Editor` in `pl-6`: its handles are drawn left of its box.
- Entry points (`package.json` `exports`): `.` → `index.ts`, `./plugins`, `./schema` (zod, optional peer), `./model`, `./locales/*`. Update `index.ts` or `plugins/index.ts` with every public API change.
- UI text is English in the source; translations are `locales/<lang>.ts` (English text → translation), including plugin labels, hints, keys, field labels and tags.
- `dist/` and `.svelte-kit/` are generated. Peer dependencies: `svelte` 5, `@atom-forge/ui`, `@lucide/svelte`, optionally `zod`.
- Use `bun`. There is no test suite yet.
- Typecheck: `bun run check` · Package: `bun run prepack` (SvelteKit sync, `svelte-package`, `publint`)
- Release: `bun run pub <patch|minor|major>` · Verify: `bun run pub-check`
- Local use in an app: `bun link` here, `"@atom-forge/brickee": "link:@atom-forge/brickee"` there, and `bun run prepack` after each change (the app reads `dist/`). The linked folder carries its own `node_modules`: the app must dedupe `svelte`, `@atom-forge/ui`, `@lucide/svelte` and `zod` in Vite (`resolve.dedupe`) and point the `svelte` types to its own copy.
