// Dragging blocks by their handle, within an editor and between an editor and the editors nested in its blocks (and
// back). The editors of one tree share a hub through a context: what is being dragged, where it would land, and which
// editor was worked in last (only that one keeps a block selection).
import { getContext, setContext } from 'svelte';
import type { StoredBlock } from '../types';

const KEY = 'brickee:hub';

export type DragSource = {
	/** The token of the editor the blocks come from. */
	editor: string;
	ids: string[];
	/** The blocks in their stored form, for another editor to copy in. */
	payload: StoredBlock[];
	/** Their rows (a drop target inside one of them is inside the dragged blocks). */
	rows: HTMLElement[];
	/** Takes the blocks out of their editor (after another editor copied them in). */
	remove: () => void;
};

export type Hub = {
	src: DragSource | null;
	target: { editor: string; over: string; after: boolean } | null;
	/** The editor worked in last. */
	active: string | null;
};

/** The hub of this tree of editors: the parent editor's, or a new one for a top editor. Call in component init. */
export function useHub(): Hub {
	const own = $state<Hub>({ src: null, target: null, active: null });
	const hub = getContext<Hub>(KEY) ?? own;
	setContext(KEY, hub);
	return hub;
}

export interface DragHost {
	/** This editor's token (a string, not an object: $state would proxy an object and break identity checks). */
	token: string;
	hub: Hub;
	root(): HTMLElement;
	ownRow(node: Element | null): HTMLElement | null;
	/** The blocks a drag from this block moves: the block selection if the block is in it, otherwise the block. */
	moving(id: string): string[];
	/** The stored form of these blocks. */
	payload(ids: string[]): StoredBlock[];
	/** Takes these blocks out (an undo step). */
	remove(ids: string[]): void;
	/** Can this editor hold these blocks (the plugins it offers)? */
	holds(payload: StoredBlock[]): boolean;
	/** Moves its own blocks before or after another one (an undo step). */
	move(ids: string[], over: string, after: boolean): void;
	/** Puts another editor's blocks before or after one of its own (an undo step). */
	insert(payload: StoredBlock[], over: string, after: boolean): void;
}

export function createDrag(host: DragHost) {
	const { hub, token } = host;

	/** Can the dragged blocks land in this editor? Not inside themselves, and only plugins this editor offers. */
	function accepts(src: DragSource) {
		if (src.editor === token) return true;
		if (src.rows.some((r) => r.contains(host.root()))) return false;
		return host.holds(src.payload);
	}

	return {
		/** On a handle's dragstart. */
		start(e: DragEvent, id: string) {
			const ids = host.moving(id);
			hub.src = {
				editor: token,
				ids,
				payload: host.payload(ids),
				rows: ids.map((x) => host.root().querySelector<HTMLElement>(`[data-block="${x}"]`)!).filter(Boolean),
				remove: () => host.remove(ids)
			};
			hub.target = null;
			if (!e.dataTransfer) return;
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', ' ');
			const row = (e.currentTarget as HTMLElement).closest('.row');
			if (row) e.dataTransfer.setDragImage(row, 0, 0);
		},
		/** On the editor's dragover. */
		over(e: DragEvent) {
			// A nested editor deeper in the tree already took this event.
			if (!hub.src || e.defaultPrevented) return;
			const row = host.ownRow(e.target as Element);
			if (!row || !accepts(hub.src)) return;
			e.preventDefault();
			const r = row.getBoundingClientRect();
			hub.target = { editor: token, over: row.dataset.block!, after: e.clientY > r.top + r.height / 2 };
		},
		/** On the editor's drop. */
		drop(e: DragEvent) {
			const src = hub.src;
			const at = hub.target;
			if (!src || at?.editor !== token) return;
			e.preventDefault();
			hub.src = hub.target = null;
			if (src.ids.includes(at.over)) return;
			if (src.editor === token) return host.move(src.ids, at.over, at.after);
			// From another editor: copy in through the stored form, then remove at the source.
			host.insert(src.payload, at.over, at.after);
			src.remove();
		},
		/** On dragend: nothing is dragged any more. */
		end() {
			hub.src = hub.target = null;
		},
		/** Is this block of this editor being dragged? */
		moves: (id: string) => hub.src?.editor === token && hub.src.ids.includes(id),
		/** The drop line before (or after) this block. */
		mark: (id: string, after: boolean) =>
			hub.target?.editor === token && hub.target.over === id && hub.target.after === after && !hub.src?.ids.includes(id)
	};
}
