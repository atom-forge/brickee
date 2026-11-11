# Host contexts

[← Previous](writing-plugins.md) · [Contents](index.md) · [Next →](server-side.md)

The editor has no props for application concepts. Two things the editor itself uses come from the host through Svelte contexts: the code languages it highlights and its language. Each has a `provide…` function, called in a component's initialization above the editor or preview, and a `use…` function for plugin components.

| Context | Provide | Read | Carries |
|---|---|---|---|
| Code languages | `provideCodeLanguages(() => list)` | `useCodeLanguages()` | The languages a code block offers. |
| Text | `messages` prop, or `provideText(() => messages)` | `useText()` | UI text in the host's language. |

Nested editors and previews inherit both from their parent.

Everything else the app knows — the screen width it is showing, its media library, the current user — is not the editor's business. A plugin is the app's own code: it reads such things from the app's own modules, stores or contexts (provided above the editor and the preview), and shows its own controls in its view or in its own fields form (see [Custom fields form](writing-plugins.md#custom-fields-form)).

## Code languages

A code block's language (`props.lang`, the info string of its markdown fence) is free text by default. When the host knows which languages its site can highlight, it gives the list, and the field in the code block's fields bar becomes a dropdown of them, with *None* first:

```svelte
<script lang="ts">
	import { Editor, provideCodeLanguages, type StoredBlock } from '@atom-forge/brickee';

	let { value = $bindable() }: { value: StoredBlock[] } = $props();
	provideCodeLanguages(() => [{ value: 'ts', label: 'TypeScript' }, { value: 'svelte', label: 'Svelte' }, 'css', 'bash']);
</script>

<Editor bind:value />
```

An item is a string or `{ value, label? }`; the value is what is stored. Nested editors inherit the list. A stored language missing from the list stays an option, so opening an older document loses nothing.

## UI text

The editor and the plugins are written in English, and the English text is the key of its translation. Pass `messages` — an object from English text to your language — to the top-level editor and preview:

```svelte
<script lang="ts">
	import { Editor, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { hu } from '@atom-forge/brickee/locales/hu';

	let value = $state<StoredBlock[]>([]);
</script>

<Editor bind:value plugins={PLUGINS} messages={hu} />
```

`@atom-forge/brickee/locales/hu` exports `hu`, the Hungarian text of the editor and of every bundled plugin. Extend it with the text of your own plugins and fields:

```ts
import type { Messages } from '@atom-forge/brickee';
import { hu } from '@atom-forge/brickee/locales/hu';

export const messages: Messages = {
	...hu,
	Button: 'Gomb',
	'A link as a button': 'Egy link gombként'
};
```

What the editor translates by itself:

- the built-in and plugin `label`, `hint` and `keys` (the slash menu searches the English and the translated words);
- the parts of a plugin's `tag`, split at ` · `;
- field labels, placeholders, option labels and `none` labels;
- the text of `Empty`, and the editor's own interface.

Text a plugin renders itself — in its view or preview — goes through `useText()`:

```svelte
<script lang="ts">
	import { useText, type PluginPreviewProps } from '@atom-forge/brickee';

	let { props }: PluginPreviewProps = $props();
	const tr = useText();
</script>

<p>{tr('Map: {place}', { place: String(props.q ?? '') })}</p>
```

`{name}` placeholders are filled from the second argument. Outside components, `translator(messages)` returns the same kind of function. A text missing from `messages` stays English.
