// UI text. The editor and the plugins are written in English; a host passes `messages` (English text -> its own) to
// the top editor or preview, and nested editors and plugin views inherit them. `{name}` placeholders are filled in.
import { getContext, setContext } from 'svelte';

export type Messages = Record<string, string>;
export type Translate = (text: string, vars?: Record<string, string | number>) => string;

const KEY = 'brickee:text';
type Get = () => Messages | undefined;

export const translator =
	(messages?: Messages): Translate =>
	(text, vars) => {
		const out = messages?.[text] ?? text;
		return vars ? out.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : out;
	};

/** Call in a component's init. Without its own messages, a nested editor or preview keeps its parent's. */
export function provideText(own: () => Messages | undefined) {
	const parent = getContext<Get | undefined>(KEY);
	setContext<Get>(KEY, () => own() ?? parent?.());
}

/** Call in a component's init; the returned function translates with the current messages. */
export function useText(): Translate {
	const get = getContext<Get | undefined>(KEY);
	return (text, vars) => translator(get?.())(text, vars);
}
