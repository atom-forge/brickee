<script lang="ts">
	import { Editor, Preview, type Messages, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { hu } from '@atom-forge/brickee/locales/hu';
	import { note } from '$site/blocks/note';

	// English source text is the key. Extend the bundled translation with your own plugins' text.
	const messages: Messages = {
		...hu,
		Note: 'Megjegyzés',
		'Boxed text with a title': 'Keretes szöveg címmel',
		'note aside box': 'megjegyzés doboz keret',
		'Write the note…': 'Írd meg a megjegyzést…'
	};
	const plugins = [...PLUGINS, note];
	let value = $state<StoredBlock[]>([
		{ type: 'md:p', indent: 0, text: 'Nyomj `/`-t egy üres sorban: a blokkmenü magyarul keres („táblázat”, „térkép”).' },
		{ type: 'map', indent: 0, props: { q: 'Pécs, Széchenyi tér', zoom: '15' } }
	]);
</script>

<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value {plugins} {messages} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} {plugins} {messages} />
	</article>
</div>
