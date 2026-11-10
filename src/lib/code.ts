// The languages a code block offers. Without a list (the default) its language is free text; with one, the field is a
// dropdown of these. Which languages make sense is the host's business (what its site can highlight).
import { getContext, setContext } from 'svelte';

/** A language: its value is stored in the block (`props.lang`, the opening fence's info string). */
export interface CodeLanguage {
	value: string;
	/** Shown in the dropdown; defaults to the value. */
	label?: string;
}

const KEY = 'block-editor:code-languages';
type Get = () => CodeLanguage[];

const normalize = (list: (string | CodeLanguage)[]) => list.map((l) => (typeof l === 'string' ? { value: l } : l));

/** Call in a component's init (around the editor). Without its own list, a nested editor keeps its parent's. */
export function provideCodeLanguages(own: () => (string | CodeLanguage)[] | undefined) {
	const parent = getContext<Get | undefined>(KEY);
	setContext<Get>(KEY, () => {
		const list = own();
		return list ? normalize(list) : (parent?.() ?? []);
	});
}

/** Call in a component's init; the returned function reads the current list (empty: free text). */
export const useCodeLanguages = (): Get => getContext<Get | undefined>(KEY) ?? (() => []);
