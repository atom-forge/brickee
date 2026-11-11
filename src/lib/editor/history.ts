// The editor's undo history: snapshots of the document (and where the caret was), one step per structural change,
// consecutive typing collapsed into one step.

export class History<S> {
	#past: S[] = [];
	#future: S[] = [];
	#last: S;
	#pending = false;
	#timer: ReturnType<typeof setTimeout> | undefined;

	/**
	 * @param take  a snapshot of the editor now
	 * @param apply puts the editor back into a snapshot
	 * @param limit how many steps are kept
	 * @param settle how long (ms) typing waits before its step is closed
	 */
	constructor(
		private take: () => S,
		private apply: (s: S) => void,
		private limit = 300,
		private settle = 600
	) {
		this.#last = take();
	}

	#push(s: S) {
		this.#past.push(s);
		if (this.#past.length > this.limit) this.#past.shift();
		this.#future = [];
	}

	#settle() {
		clearTimeout(this.#timer);
		this.#pending = false;
	}

	/** Call on every text edit: consecutive typing collapses into one undo step. */
	typed() {
		if (!this.#pending) {
			this.#push(this.#last);
			this.#pending = true;
		}
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => {
			this.#pending = false;
			this.#last = this.take();
		}, this.settle);
	}

	/** Wrap every structural change: pushes an undo step. */
	mutate(fn: () => void) {
		this.#settle();
		this.#push(this.take());
		fn();
		this.#last = this.take();
	}

	/** Drops the undo and redo steps (a document loaded from outside). */
	forget() {
		this.#settle();
		this.#past = [];
		this.#future = [];
		this.#last = this.take();
	}

	undo() {
		this.#settle();
		const s = this.#past.pop();
		if (!s) return;
		this.#future.push(this.take());
		this.#restore(s);
	}

	redo() {
		this.#settle();
		const s = this.#future.pop();
		if (!s) return;
		this.#past.push(this.take());
		this.#restore(s);
	}

	#restore(s: S) {
		this.#last = s;
		this.apply(s);
	}

	/** Stops the pending timer (the editor is going away). */
	dispose() {
		clearTimeout(this.#timer);
	}
}
