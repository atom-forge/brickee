<script lang="ts">
	import { DocInlineCode } from '@atom-forge/ui';
	import PluginDoc from '$site/PluginDoc.svelte';
	import Example from './examples/Example.svelte';
	import code from './examples/Example.svelte?raw';
</script>

<PluginDoc title="Table" name="table" type="table" example={Example} {code} markdown="a GFM table (pipes in cells escaped)."
	props={[
		{ name: 'rows', type: 'string[][]', description: 'The cells, row by row, as inline markdown.' },
		{ name: 'heads', type: "('top' | 'bottom')[]", default: "['top']", description: 'The first row is a header, the last a footer (sums).' }
	]}>
	Rows and columns of inline-formatted cells — price lists, schedules, fines. The cells are edited in place; click one
	for its row and column tools (insert, delete, align), and drag rows and columns by their grips. Its fields bar sets the
	header and the footer row. Helpers for your own preview: <DocInlineCode>tableHeads</DocInlineCode>,
	<DocInlineCode>rowHead</DocInlineCode>, <DocInlineCode>HEADS</DocInlineCode>, <DocInlineCode>square</DocInlineCode>.
</PluginDoc>
