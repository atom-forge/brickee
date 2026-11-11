<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { inlineMath, math } from '@atom-forge/brickee/math';

	const plugins = [math];
	// Inline plugins live inside the text: a separate list, given to the editor and the preview alike.
	const inlinePlugins = [inlineMath];
	let value = $state<StoredBlock[]>([
		{ type: 'md:p', indent: 0, text: 'Einstein wrote $E = mc^2$, and the area of a circle is $\\pi r^2$. Type `$a^2$` and a space, or click a formula to edit it.' }
	]);
</script>

<div class="grid gap-6 md:grid-cols-2">
	<div class="pl-6"><Editor bind:value {plugins} {inlinePlugins} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} {plugins} {inlinePlugins} />
	</article>
</div>
