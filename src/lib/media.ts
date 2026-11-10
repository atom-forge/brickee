// The images a document can use: the host's attachments (on a CMS page, the page's uploaded images). Blocks store
// an attachment's id; the editor, the preview and the plugins look it up here.
import { getContext, setContext } from 'svelte';

export interface MediaItem {
	/** Stored in the block's props. */
	id: string;
	/** File name or title, shown in the picker. */
	name: string;
	/** Address of the image (a thumbnail size is fine for the editor). */
	url: string;
	/** Where it comes from (e.g. the attachment category), shown as a heading in the picker. */
	group?: string;
}

const KEY = 'block-editor:media';
type Get = () => MediaItem[];

/** Call in a component's init. Without its own list, a nested editor or preview keeps its parent's. */
export function provideMedia(own: () => MediaItem[] | undefined) {
	const parent = getContext<Get | undefined>(KEY);
	setContext<Get>(KEY, () => own() ?? parent?.() ?? []);
}

/** Call in a component's init; the returned function reads the current list. */
export const useMedia = (): Get => getContext<Get | undefined>(KEY) ?? (() => []);

export const findMedia = (list: MediaItem[], id: unknown) => list.find((m) => m.id === id);
