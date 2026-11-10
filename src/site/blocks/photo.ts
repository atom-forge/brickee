import { ImageIcon } from '@lucide/svelte';
import { mdText, type BlockPlugin } from '@atom-forge/brickee';
import { findImage } from './images';

// Images are this app's business, not Brickee's: the block stores an id from the app's library (it could just as well
// store a URL), picks it in its own view (PhotoView) and resolves it with the app's own lookup.
import PhotoView, { type PhotoProps } from './PhotoView.svelte';
import PhotoPreview from './PhotoPreview.svelte';

export const photo: BlockPlugin<PhotoProps> = {
	type: 'photo',
	label: 'Photo',
	hint: 'One picked image',
	keys: 'photo image picture',
	icon: ImageIcon,
	props: () => ({ image: '', alt: '' }),
	fields: [
		{ key: 'alt', label: 'Alt text', kind: 'text', placeholder: 'What the image shows' },
		{ key: 'ratio', label: 'Height', kind: 'slider', min: 20, max: 150, unit: '%', none: 'Original' }
	],
	tag: () => 'photo',
	content: 'none',
	markdown: (p) => {
		const url = findImage(p.image)?.url;
		return url ? `![${mdText(p.alt)}](${url})` : '';
	},
	view: PhotoView,
	preview: PhotoPreview
};
