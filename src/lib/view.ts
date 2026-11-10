// The view the per-view fields edit (see PropField.views). Which views there are and which one is shown is the
// host's business (e.g. the width its preview shows): it gives the current one through the context. Without it, a
// per-view field simply edits its base value.
import { getContext, setContext } from 'svelte';

const KEY = 'block-editor:view';
type Get = () => string | undefined;

/** Call in a component's init (around the editor); the function returns the current view's key. */
export function provideView(get: Get) {
	setContext<Get>(KEY, get);
}

/** Call in a component's init; the returned function reads the current view's key (undefined: none given). */
export const useView = (): Get => getContext<Get | undefined>(KEY) ?? (() => undefined);
