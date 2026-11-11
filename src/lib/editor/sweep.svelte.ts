// A text selection dragged out of its block turns into a selection of whole blocks (each block is its own editable
// field, so the browser cannot select text across them). Nested editors run the same logic, so a sweep that leaves a
// box is taken over by the editor around it, with the box as one block.

export interface SweepHost {
	/** The editor's root element. */
	root(): HTMLElement;
	/** The editor's own row (not a nested editor's) that holds this node, or null. */
	ownRow(node: Element | null): HTMLElement | null;
	readonly(): boolean;
	/** Select the blocks from `anchor` to `head`. */
	select(anchor: string, head: string): void;
	/** Drop the block selection (back to text selection). */
	clear(): void;
	/** Take the focus from the text field, to the root (the block selection's keys). */
	focusRoot(): void;
}

export function createSweep(host: SweepHost) {
	let sweeping = $state(false);
	let from: Element | null = null;

	function move(e: MouseEvent) {
		const start = host.ownRow(from);
		const here = document.elementFromPoint(e.clientX, e.clientY);
		if (!start || !here) return;
		const root = host.root();
		const row = root.contains(here) ? host.ownRow(here) : null;
		// Left this editor, or came back to the starting block: back to plain text selection.
		if (!root.contains(here) || row === start) {
			if (sweeping) {
				sweeping = false;
				host.clear();
			}
			return;
		}
		if (!row) return;
		if (!sweeping) {
			sweeping = true;
			host.focusRoot();
		}
		getSelection()?.removeAllRanges();
		host.select(start.dataset.block!, row.dataset.block!);
	}

	function end() {
		removeEventListener('mousemove', move);
		removeEventListener('mouseup', end);
		from = null;
		sweeping = false;
	}

	return {
		/** True while whole blocks are being swept (the browser must not extend its own selection meanwhile). */
		get sweeping() {
			return sweeping;
		},
		/** On the editor's mousedown: a press in a block's text may start a sweep. */
		start(e: MouseEvent) {
			if (host.readonly() || e.button !== 0 || e.shiftKey) return;
			const t = e.target as Element;
			if (!t.closest('.ce') || t.closest('.grab')) return;
			from = t;
			addEventListener('mousemove', move);
			addEventListener('mouseup', end, { once: true });
		},
		/** Stops a sweep and its listeners (also when the editor goes away). */
		end
	};
}
