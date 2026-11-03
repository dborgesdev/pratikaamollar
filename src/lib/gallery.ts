/** Swipe only when the horizontal gesture is deliberate; leave vertical scrolling to the browser. */
export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 { return Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.35 ? dx < 0 ? 1 : -1 : 0; }
export function galleryIndex(current: number, delta: number, count: number): number { return count > 0 ? (current + delta + count) % count : 0; }
