// The images of this demo app, used by its photo block.
export interface Image {
	id: string;
	name: string;
	url: string;
}

/** A tiny inline SVG as an image URL, so the examples need no files. */
const swatch = (from: string, to: string, label: string) =>
	'data:image/svg+xml;utf8,' +
	encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="640" height="400" fill="url(#g)"/><text x="320" y="215" font-family="system-ui, sans-serif" font-size="44" font-weight="700" fill="white" text-anchor="middle">${label}</text></svg>`
	);

/** This app's image library. Brickee knows nothing about images: the photo block decides what it stores (here an id)
 * and how it turns that into a picture. A real app would load this from its own store. */
export const IMAGES: Image[] = $state([
	{ id: 'sunrise', name: 'sunrise.svg', url: swatch('#f97316', '#db2777', 'Sunrise') },
	{ id: 'ocean', name: 'ocean.svg', url: swatch('#0ea5e9', '#4f46e5', 'Ocean') },
	{ id: 'forest', name: 'forest.svg', url: swatch('#22c55e', '#0f766e', 'Forest') },
	{ id: 'stone', name: 'stone.svg', url: swatch('#a8a29e', '#44403c', 'Stone') }
]);

export const findImage = (id: unknown) => IMAGES.find((i) => i.id === id);

/** A file the user pasted or dropped, added to the library (this demo keeps it in the browser only). */
export function addImage(file: File): string {
	const id = `upload-${IMAGES.length}`;
	IMAGES.push({ id, name: file.name, url: URL.createObjectURL(file) });
	return id;
}
