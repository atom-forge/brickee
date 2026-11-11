// The inline plugins of a document reach nested editors and plugin views (a table's cells) through a context, like
// the UI text: the top editor or preview provides them, the ones inside inherit them.
import { getContext, setContext } from 'svelte';
import type { InlinePlugin } from './types';

const KEY = 'brickee:inline-plugins';
type Get = () => InlinePlugin<any>[];

/** Call in a component's init. Without its own list, a nested editor or preview keeps its parent's. */
export function provideInlinePlugins(own: () => InlinePlugin<any>[] | undefined) {
	const parent = getContext<Get | undefined>(KEY);
	setContext<Get>(KEY, () => own() ?? parent?.() ?? []);
}

/** Call in a component's init; the returned function reads the current inline plugins. */
export const useInlinePlugins = (): Get => getContext<Get | undefined>(KEY) ?? (() => []);
