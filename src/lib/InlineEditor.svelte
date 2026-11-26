<!-- One line of inline markdown in an editor: the `oneline` mode of `Editor`, with a string value instead of a
     document. For a field of formatted text: an answer, a caption, a table cell's title. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import Editor from './Editor.svelte';
	import type { Messages } from './i18n';
	import type { InlinePlugin, StoredBlock } from './types';

	interface Props {
		/** The text as inline markdown (`**bold**`, `$x^2$` with the inline math plugin…), always one line. */
		value?: string;
		readonly?: boolean;
		placeholder?: string;
		/** UI text in the host's language (English text -> translation). */
		messages?: Messages;
		/** Inline plugins (a formula inside the text…). */
		inlinePlugins?: InlinePlugin<any>[];
		/** Enter was pressed (e.g. to move on to the next field). */
		onenter?: () => void;
	}
	let { value = $bindable(''), readonly = false, placeholder, messages, inlinePlugins, onenter }: Props = $props();

	const paragraph = (text: string): StoredBlock[] => [{ type: 'md:p', indent: 0, text }];
	/** The document's text as one line (a line break or a second paragraph, from outside, becomes a space). */
	const lineOf = (doc: StoredBlock[]) =>
		doc
			.map((b) => b.text ?? '')
			.join(' ')
			.replace(/\\?\n/g, ' ')
			.trim();

	let doc = $state<StoredBlock[]>(untrack(() => paragraph(value)));

	// the editor's text -> the value
	$effect(() => {
		const line = lineOf(doc);
		if (line !== untrack(() => value)) value = line;
	});
	// a value set from outside -> the editor
	$effect(() => {
		const v = value;
		if (v !== untrack(() => lineOf(doc))) doc = paragraph(v);
	});
</script>

<Editor bind:value={doc} oneline {readonly} {placeholder} {messages} {inlinePlugins} {onenter} />
