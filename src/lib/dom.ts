/** Svelte action: sets innerHTML once and only re-syncs when the model differs from the DOM (keeps the caret). */
export function rich(node: HTMLElement, value: string) {
	node.innerHTML = value;
	return {
		update(v: string) {
			if (node.innerHTML !== v) node.innerHTML = v;
		}
	};
}

/**
 * Svelte action: moves the element to the end of the body. A floating menu positioned with `position: fixed` is then
 * placed against the viewport even when the editor sits in a transformed parent (an animated drawer, a dialog), where
 * `fixed` would be relative to that parent.
 */
export function portal(node: HTMLElement) {
	document.body.appendChild(node);
	return { destroy: () => node.remove() };
}

export function serialize(frag: DocumentFragment): string {
	const d = document.createElement('div');
	d.append(frag);
	return d.innerHTML;
}

/** Returns '' for html that has no visible text (e.g. `<b></b>`, `<br>`). */
export function clean(h: string): string {
	const d = document.createElement('div');
	d.innerHTML = h;
	return d.textContent ? h : '';
}

export function textLen(h: string): number {
	const d = document.createElement('div');
	d.innerHTML = h;
	return d.textContent?.length ?? 0;
}

function range(): Range | null {
	const sel = getSelection();
	return sel && sel.rangeCount ? sel.getRangeAt(0) : null;
}

export function splitAtCaret(el: HTMLElement): [string, string] | null {
	const r = range();
	if (!r) return null;
	const pre = document.createRange();
	pre.selectNodeContents(el);
	pre.setEnd(r.startContainer, r.startOffset);
	const post = document.createRange();
	post.selectNodeContents(el);
	post.setStart(r.endContainer, r.endOffset);
	return [serialize(pre.cloneContents()), serialize(post.cloneContents())];
}

export function atStart(el: HTMLElement): boolean {
	const r = range();
	if (!r || !r.collapsed) return false;
	const pre = document.createRange();
	pre.selectNodeContents(el);
	pre.setEnd(r.startContainer, r.startOffset);
	return pre.toString() === '';
}

export function atEnd(el: HTMLElement): boolean {
	const r = range();
	if (!r || !r.collapsed) return false;
	const post = document.createRange();
	post.selectNodeContents(el);
	post.setStart(r.endContainer, r.endOffset);
	return post.toString() === '';
}

export function caretOffset(el: HTMLElement): number {
	const r = range();
	if (!r || !el.contains(r.startContainer)) return 0;
	const pre = document.createRange();
	pre.selectNodeContents(el);
	pre.setEnd(r.startContainer, r.startOffset);
	return pre.toString().length;
}

export function setCaret(el: HTMLElement, where: 'start' | 'end' | number = 'end') {
	el.focus({ preventScroll: true });
	const sel = getSelection();
	if (!sel) return;
	const r = document.createRange();
	r.selectNodeContents(el);
	if (where === 'start') r.collapse(true);
	else if (where === 'end') r.collapse(false);
	else {
		r.collapse(false);
		const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		let left = where;
		let n: Node | null;
		while ((n = w.nextNode())) {
			const len = n.textContent?.length ?? 0;
			if (left <= len) {
				r.setStart(n, left);
				r.collapse(true);
				break;
			}
			left -= len;
		}
	}
	sel.removeAllRanges();
	sel.addRange(r);
	el.scrollIntoView({ block: 'nearest' });
}

/** Viewport rect of the caret, or null when the browser can't tell (empty block). */
export function caretRect(): DOMRect | null {
	const r = range();
	if (!r) return null;
	const c = r.cloneRange();
	c.collapse(false);
	const rects = c.getClientRects();
	const rect = rects.length ? rects[rects.length - 1] : c.getBoundingClientRect();
	return rect && (rect.width || rect.height) ? rect : null;
}

/** Places the caret in `el` at the viewport point (x, y). Keeps the horizontal position while moving between blocks. */
export function caretAt(el: HTMLElement, x: number, y: number): boolean {
	const d = document as any;
	let r: Range | null = null;
	if (d.caretPositionFromPoint) {
		const p = d.caretPositionFromPoint(x, y);
		if (p) {
			r = document.createRange();
			r.setStart(p.offsetNode, p.offset);
		}
	} else if (d.caretRangeFromPoint) {
		r = d.caretRangeFromPoint(x, y);
	}
	if (!r || !el.contains(r.startContainer)) return false;
	r.collapse(true);
	el.focus({ preventScroll: true });
	const sel = getSelection()!;
	sel.removeAllRanges();
	sel.addRange(r);
	el.scrollIntoView({ block: 'nearest' });
	return true;
}

/** Deletes `n` characters directly before the caret (inside the caret's text node). */
export function removeBeforeCaret(n: number): boolean {
	const r = range();
	if (!r || r.startContainer.nodeType !== Node.TEXT_NODE || r.startOffset < n) return false;
	const t = r.startContainer as Text;
	const off = r.startOffset;
	t.deleteData(off - n, n);
	const nr = document.createRange();
	nr.setStart(t, off - n);
	nr.collapse(true);
	const sel = getSelection()!;
	sel.removeAllRanges();
	sel.addRange(nr);
	return true;
}

/** Is the caret on the first (up) or last (down) visual line of the block? */
export function onEdgeLine(el: HTMLElement, up: boolean): boolean {
	const sel = getSelection();
	if (!sel || !sel.isCollapsed) return false;
	const cr = caretRect();
	if (!cr) return true;
	const er = el.getBoundingClientRect();
	const lh = parseFloat(getComputedStyle(el).lineHeight) || 24;
	return up ? cr.top - er.top < lh * 0.5 : er.bottom - cr.bottom < lh * 0.5;
}

const MARKS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'SUB', 'SUP', 'CODE', 'A']);

/**
 * Plain text: a selection loses every mark and link; a caret steps out of the marks around it, so what is typed next
 * is plain (a zero-width space holds it there; the markdown conversion drops it).
 */
export function plainText(el: HTMLElement) {
	const sel = getSelection();
	const r = range();
	if (!sel || !r || !el.contains(r.commonAncestorContainer)) return;
	if (!r.collapsed) {
		document.execCommand('removeFormat');
		document.execCommand('unlink');
		return;
	}
	let outer: Node | null = null;
	for (let n: Node | null = r.startContainer; n && n !== el; n = n.parentNode) if (MARKS.has(n.nodeName)) outer = n;
	if (!outer) return;
	const t = document.createTextNode('\u200B');
	(outer as ChildNode).after(t);
	const nr = document.createRange();
	nr.setStart(t, 1);
	nr.collapse(true);
	sel.removeAllRanges();
	sel.addRange(nr);
}

export function toggleCode(el: HTMLElement) {
	const sel = getSelection();
	const r = range();
	if (!sel || !r || r.collapsed) return;
	const anc = r.commonAncestorContainer;
	const host = (anc instanceof Element ? anc : anc.parentElement)?.closest('code');
	if (host && el.contains(host)) {
		const nodes = [...host.childNodes];
		host.replaceWith(...nodes);
		return;
	}
	const c = document.createElement('code');
	c.append(r.extractContents());
	r.insertNode(c);
	const nr = document.createRange();
	nr.selectNodeContents(c);
	sel.removeAllRanges();
	sel.addRange(nr);
}

/** Is the selection's moving end (focus) at the very start (up) or end (down) of the block's text? */
export function focusAtEdge(el: HTMLElement, up: boolean): boolean {
	const sel = getSelection();
	if (!sel || !sel.focusNode || !el.contains(sel.focusNode)) return false;
	const r = document.createRange();
	r.selectNodeContents(el);
	if (up) r.setEnd(sel.focusNode, sel.focusOffset);
	else r.setStart(sel.focusNode, sel.focusOffset);
	return r.toString() === '';
}
