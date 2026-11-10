// Scroll sync: a target box (e.g. a preview) follows a source box (e.g. the editor) by proportion — scrolled to the
// same fraction of its own scroll range. The two show roughly the same place, not exactly the same block.
import type { Action } from 'svelte/action';

/** How far a box is scrolled, 0…1 (0 when it does not scroll). */
export const scrollFraction = (box: HTMLElement) => {
	const max = box.scrollHeight - box.clientHeight;
	return max > 0 ? box.scrollTop / max : 0;
};

/** Scrolls a box to a fraction (0…1) of its scroll range. */
export const setScrollFraction = (box: HTMLElement, f: number) => {
	box.scrollTop = Math.min(1, Math.max(0, f)) * (box.scrollHeight - box.clientHeight);
};

export interface ScrollSync {
	/** The box the reader scrolls (e.g. the editor's). */
	source: Action<HTMLElement>;
	/**
	 * The box that follows it (e.g. the preview's); its content changing size keeps it in step too. Its parameter turns
	 * it on and off (default on), for a host that switches between two boxes.
	 */
	target: Action<HTMLElement, boolean | undefined>;
	/** Puts the target in step now (e.g. after its width changed). */
	align(): void;
}

/** Keeps a target box scrolled to the same fraction as the source box. One way: scrolling the target moves nothing else. */
export function scrollSync(): ScrollSync {
	let source: HTMLElement | null = null;
	let target: HTMLElement | null = null;
	let frame = 0;
	const align = () => {
		frame = 0;
		if (source && target) setScrollFraction(target, scrollFraction(source));
	};
	const later = () => (frame ||= requestAnimationFrame(align));
	return {
		source(node) {
			source = node;
			node.addEventListener('scroll', later, { passive: true });
			return {
				destroy() {
					node.removeEventListener('scroll', later);
					if (source === node) source = null;
				}
			};
		},
		target(node, on = true) {
			const watch = new ResizeObserver(later);
			const use = (yes: boolean | undefined = true) => {
				watch.disconnect();
				if (!yes) return void (target === node && (target = null));
				target = node;
				for (const child of node.children) watch.observe(child);
				watch.observe(node);
				later();
			};
			use(on);
			return {
				update: use,
				destroy() {
					watch.disconnect();
					if (target === node) target = null;
				}
			};
		},
		align
	};
}
