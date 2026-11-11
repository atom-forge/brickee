<script lang="ts">
	import { DocInlineCode, DocShowCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle } from '@atom-forge/ui';

	import Example from './examples/Example.svelte';
	import example from './examples/Example.svelte?raw';
	import photoTs from '$site/blocks/photo.ts?raw';
	import photoForm from '$site/blocks/PhotoForm.svelte?raw';
	import photoView from '$site/blocks/PhotoView.svelte?raw';
	import photoPreview from '$site/blocks/PhotoPreview.svelte?raw';
	import imagesTs from '$site/blocks/images.svelte.ts?raw';

	const files = [
		{ name: 'photo.ts', language: 'typescript', code: photoTs },
		{ name: 'PhotoForm.svelte', language: 'svelte', code: photoForm },
		{ name: 'PhotoView.svelte', language: 'svelte', code: photoView },
		{ name: 'PhotoPreview.svelte', language: 'svelte', code: photoPreview },
		{ name: 'images.svelte.ts', language: 'typescript', code: imagesTs }
	];
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>Custom fields form</ProseTitle>
		<ProseText>
			The generated <DocInlineCode>fields</DocInlineCode> cover simple settings. For anything else a plugin gives its
			own <DocInlineCode>form</DocInlineCode>: any Svelte component, shown in the block's fields bar below the fields
			(or alone). It receives the block's <DocInlineCode>props</DocInlineCode> bound: assigning a new object is one
			edit of the block, with its own undo step. What it shows and where it takes its data from is the app's code — its
			own stores, its own contexts, its own scripts.
		</ProseText>
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>A photo block with its own picker</ProseTitle>
		<ProseText>
			This demo stores an id from the app's image library. Its form offers the images of the album the app names in a
			context of its own (switch it above the editor) and uploads a file with its own script; alt text and height are
			ordinary fields. Paste or drop an image file into the editor: the plugin's <DocInlineCode>fromFiles</DocInlineCode>
			adds it to the library and makes a photo of it.
		</ProseText>
		<DocShowCode code={files} />
		<DocShowExample class="block" component={Example} code={example} />
	</ProseParagraph>
</ProsePage>
