# Brickee

`@atom-forge/brickee` is a block editor for Svelte 5. Its core is a markdown block editor — paragraphs, headings, lists, todos, quotes, code, rules — and everything else is a plugin: a block with an editor view, a site preview, its fields, and optionally a markdown form. Documents are stored as JSON.

- **Core** — the markdown blocks and the kit plugins are written with. Without plugins it is a plain markdown block editor.
- **Bundled plugins** (`@atom-forge/brickee/plugins`) — a few general blocks: YouTube, map, table, gap. Plugins like any other: pick the ones you need.
- **Your plugins** — the same `BlockPlugin` shape, in your app.

## Install

```sh
bun add @atom-forge/brickee @atom-forge/ui @lucide/svelte
```

`svelte` 5, `@atom-forge/ui` (popups and form controls; your app needs its theme CSS) and `@lucide/svelte` are peer dependencies; `zod` is an optional one for the server-side schema.

## Example

```svelte
<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { hu } from '@atom-forge/brickee/locales/hu';

	let value = $state<StoredBlock[]>([]);
</script>

<Editor bind:value plugins={PLUGINS} messages={hu} />
<Preview blocks={value} plugins={PLUGINS} />
```

## Documentation

- [Showcase](https://brickee.atom-forge.eu) — live examples with their code.
- [The Brickee book](https://books.atom-forge.eu/brickee/) — concepts, plugins, recipes, and pitfalls.
- [English docs](docs/en/index.md) · [Magyar dokumentáció](docs/hu/index.md)
- [README-AI.md](README-AI.md) — compact reference for coding agents.

Developing Brickee itself starts in [AGENTS.md](AGENTS.md).

## License

MIT
