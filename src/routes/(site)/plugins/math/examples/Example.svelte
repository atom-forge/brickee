<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { math } from '@atom-forge/brickee/math';

	const plugins = [math];
	let value = $state<StoredBlock[]>([
		{ type: 'md:p', indent: 0, text: 'The roots of a quadratic equation:' },
		{ type: 'math', indent: 0, props: { tex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' } },
		{ type: 'md:p', indent: 0, text: 'Open the formula’s fields to edit its LaTeX, or paste a `$$…$$` block.' }
	]);
</script>

<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value {plugins} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} {plugins} />
	</article>
</div>
