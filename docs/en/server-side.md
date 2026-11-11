# On the server

[← Previous](host-contexts.md) · [Contents](index.md) · [Next →](recipes-and-pitfalls.md)

A stored document is JSON sent by the browser, so the server must check it before saving. Two entry points have no Svelte dependency and are meant for server code:

- `@atom-forge/brickee/model` — `StoredBlock`, `MD`, `MAX_INDENT`, `MAX_DEPTH`, `isMd`, `acceptsId`, `inlineToPlainText`, `blocksToPlainText`;
- `@atom-forge/brickee/schema` — `blocksSchema` and `blocksSchemaFor`, built with `zod` (an optional peer dependency: install it to use this entry point).

## Validating a document

```ts
// content.server.ts
import { blocksSchemaFor } from '@atom-forge/brickee/schema';
import { plugins } from '$lib/blocks';

const contentSchema = blocksSchemaFor(plugins);

export function parseContent(input: unknown) {
	const result = contentSchema.safeParse(input);
	if (!result.success) throw new Error('Invalid content');
	return result.data; // StoredBlock[]
}
```

`blocksSchema` checks the shape of any document; `blocksSchemaFor(plugins)` adds the containers' `accepts` lists. It needs only `type` and `accepts` of each plugin, so a server that does not want to import the plugin components can pass those alone:

```ts
const contentSchema = blocksSchemaFor([
	{ type: 'note', accepts: ['md:*', 'youtube'] },
	{ type: 'youtube' }
]);
```

What the schema checks:

| Rule | Limit |
|---|---|
| Block keys | `type`, `indent`, `text`, `props`, `blocks` only (strict objects). |
| `type` | `^[a-z][a-z0-9:-]{0,39}$` |
| `indent` | An integer, 0–6. |
| `text` | At most 100 000 characters. |
| `props` | Keys up to 60 characters, JSON values. |
| `blocks` | At most 500 nested blocks per container, one level deep only. |
| Document | At most 2000 top-level blocks and 1 000 000 characters as JSON. |
| `accepts` (`blocksSchemaFor`) | Every nested block is one its container takes. |

What it does **not** check: whether a type is known, whether a unique block appears once, and what the props contain. Add your own refinements for the rules your application relies on — for example, to reject unknown block types:

```ts
import type { StoredBlock } from '@atom-forge/brickee/model';
import { blocksSchemaFor } from '@atom-forge/brickee/schema';
import { plugins } from '$lib/blocks';

const BUILT_IN = ['md:p', 'md:h1', 'md:h2', 'md:h3', 'md:h4', 'md:h5', 'md:h6', 'md:ul', 'md:ol', 'md:todo', 'md:quote', 'md:code', 'md:hr'];
const known = new Set([...BUILT_IN, ...plugins.map((p) => p.type)]);
const allKnown = (list: StoredBlock[]): boolean => list.every((b) => known.has(b.type) && allKnown(b.blocks ?? []));

export const contentSchema = blocksSchemaFor(plugins).refine(allKnown, 'Unknown block type.');
```

> **Shape, not safety**
>
> The schema keeps documents well-formed and bounded; it does not make props safe to render. The renderers escape every text and keep links to safe schemes, and each plugin preview must sanitize its own props (see [Writing plugins](writing-plugins.md)).

## Plain text

`blocksToPlainText(blocks)` collects every text of a document in order, separated by blank lines: block texts with their marks and link targets removed, string props that contain whitespace (titles, captions — not ids or colours), table rows, and nested blocks. Use it for search indexes, leads and meta descriptions. `inlineToPlainText(md)` does the same for a single inline markdown string.

```ts
import { blocksToPlainText, type StoredBlock } from '@atom-forge/brickee/model';

export const description = (doc: StoredBlock[]) => blocksToPlainText(doc).slice(0, 160);
```

## Rendering

`Preview` is an ordinary Svelte component and can be server-rendered; the core renderer and the bundled previews use no browser APIs. Only the markdown export path (`toMarkdown`, `toStored`) needs the browser.
