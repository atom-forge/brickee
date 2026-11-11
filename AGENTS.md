# Agent Instructions

Brickee (`@atom-forge/brickee`) is a Svelte 5 block editor. Its core is a markdown block editor (`md:p`, `md:h2`, `md:ul`, `md:code`…) plus the kit plugins are written with; every other block is a plugin with an editor view, a site preview and optionally a markdown form. Documents are stored as JSON (`StoredBlock[]`). The bundled plugins (`@atom-forge/brickee/plugins`) are plugins like any other.

How to use the package — its rules, API, and pitfalls — is described in [`README-AI.md`](README-AI.md). Read it before changing the package's behavior or its documentation.

Documentation model: **book-first**.

## Rules

Read the rule file that applies before you start, not only at the end:

- **Changing code, tests, or configuration** → read `AGENTS/devrules.md` first: this package's development rules, source layout, and commands.
- **Changing the book (`book/`), `docs/`, `README.md`, or `README-AI.md`** — including any change to the public API or its behavior, which always needs documentation → read `AGENTS/documentation.md` first.
- **Every task** ends with a `CHANGELOG.md` entry → follow `AGENTS/changelog.md`.

`AGENTS/changelog.md` and `AGENTS/documentation.md` are shared by every AtomForge package and are identical in all of their repositories: change them only when the change is meant for every package, and then in all AtomForge package repositories at once. Everything else in `AGENTS/` — `devrules.md` and the files it refers to — belongs to this package alone.

## Todos and notes

- `TODO.md` lists planned work, most important first, one or two lines per item. Longer context lives in `notes/`, and the item links to it.
- `notes/` holds ideas, plans, specs, and research in any form and language. Notes that are done or no longer needed move to `notes/.archived/` (kept for history, not read as current plans).
- Neither is an instruction: work on an item only when asked. When you finish one, remove it from `TODO.md` (the changelog records the change) and update the notes it made obsolete or move them to `notes/.archived/`. When you notice work outside the current task, add it to `TODO.md` and mention it in your report.
- Neither is shipped in the npm package.
