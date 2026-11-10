<script lang="ts">
	import { Editor, Preview, provideCodeLanguages, type StoredBlock } from '@atom-forge/brickee';

	// With a list, a code block's language is a dropdown; without one, free text.
	provideCodeLanguages(() => [
		{ value: 'ts', label: 'TypeScript' },
		{ value: 'svelte', label: 'Svelte' },
		{ value: 'css', label: 'CSS' },
		'bash'
	]);

	let value = $state<StoredBlock[]>([
		{ type: 'md:p', indent: 0, text: 'Open the code block’s fields bar and pick a language.' },
		{ type: 'md:code', indent: 0, text: 'const answer: number = 42;', props: { lang: 'ts' } }
	]);
</script>

<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} plugins={[]} />
	</article>
</div>
