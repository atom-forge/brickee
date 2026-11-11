// The images of this demo app, used by its photo block. Brickee knows nothing about images: the photo block decides
// what it stores (here an id) and where it takes its images from (here the album the app's own context names).
import { getContext, setContext } from 'svelte';

export interface Image {
	id: string;
	album: string;
	name: string;
	url: string;
}

/** A tiny inline SVG as an image URL, so the examples need no files. */
const swatch = (from: string, to: string, label: string) =>
	'data:image/svg+xml;utf8,' +
	encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="640" height="400" fill="url(#g)"/><text x="320" y="215" font-family="system-ui, sans-serif" font-size="44" font-weight="700" fill="white" text-anchor="middle">${label}</text></svg>`
	);

/** This app's image library. A real app would load it from its own store. */
export const IMAGES: Image[] = $state([
	{ id: 'sunrise', album: 'warm', name: 'sunrise.svg', url: swatch('#f97316', '#db2777', 'Sunrise') },
	{ id: 'desert', album: 'warm', name: 'desert.svg', url: swatch('#facc15', '#ea580c', 'Desert') },
	{ id: 'ocean', album: 'cool', name: 'ocean.svg', url: swatch('#0ea5e9', '#4f46e5', 'Ocean') },
	{ id: 'forest', album: 'cool', name: 'forest.svg', url: swatch('#22c55e', '#0f766e', 'Forest') },
	{ id: 'stone', album: 'cool', name: 'stone.svg', url: swatch('#a8a29e', '#44403c', 'Stone') }
]);

export const findImage = (id: unknown) => IMAGES.find((i) => i.id === id);

/** A file the user picked, pasted or dropped, added to an album (this demo keeps it in the browser only). */
export function addImage(file: File, album = 'uploads'): string {
	const id = `upload-${IMAGES.length}`;
	IMAGES.push({ id, album, name: file.name, url: URL.createObjectURL(file) });
	return id;
}

// The app's own context: which album the photo block offers. Brickee does not know about it; the app sets it around
// the editor, and the block's form reads it.
const KEY = 'demo:album';
export const provideAlbum = (get: () => string) => setContext(KEY, get);
export const useAlbum = (): (() => string) => getContext<() => string>(KEY) ?? (() => 'cool');
