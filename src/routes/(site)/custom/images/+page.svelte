<script lang="ts">
	import { DocInlineCode, DocShowCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle } from '@atom-forge/ui';

	import Example from './examples/Example.svelte';
	import example from './examples/Example.svelte?raw';
	import photoTs from '$site/blocks/photo.ts?raw';
	import photoView from '$site/blocks/PhotoView.svelte?raw';
	import photoPreview from '$site/blocks/PhotoPreview.svelte?raw';
	import imagesTs from '$site/blocks/images.ts?raw';

	const files = [
		{ name: 'photo.ts', language: 'typescript', code: photoTs },
		{ name: 'PhotoView.svelte', language: 'svelte', code: photoView },
		{ name: 'PhotoPreview.svelte', language: 'svelte', code: photoPreview },
		{ name: 'images.ts', language: 'typescript', code: imagesTs }
	];
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>Image blocks</ProseTitle>
		<ProseText>
			Brickee has no notion of images: no image field, no picker, no media list. An image block is an ordinary plugin of
			your app, and everything about its images is your app's decision — whether it stores a URL or an id of your media
			library, how the user picks one (in the block's view, in your own dialog, by upload), and how the preview and the
			<DocInlineCode>markdown</DocInlineCode> form turn the stored value into a picture.
		</ProseText>
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>A photo block</ProseTitle>
		<ProseText>This demo stores an id from its own image library, picks it from a row of thumbnails in the block's view, and resolves it with its own lookup. Alt text and height are ordinary fields.</ProseText>
		<DocShowCode code={files} />
		<DocShowExample class="block" component={Example} code={example} />
	</ProseParagraph>
</ProsePage>
