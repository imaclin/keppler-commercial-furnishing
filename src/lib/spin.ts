// Frame arithmetic for the 360-degree product viewer. Kept free of React so it
// can be tested directly.

/** Wraps any integer into 0..count-1, including negatives (-1 is the last frame). */
export function wrapFrame(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

/**
 * The frame to show after dragging dx pixels from startFrame. Dragging across
 * the full width of the viewer turns the product one full revolution, so the
 * rate feels the same on a phone and a desktop. Dragging right turns the
 * product to show its left side, which matches the photographer's frame order.
 */
export function frameAfterDrag(startFrame: number, dx: number, width: number, count: number): number {
  if (count <= 0 || width <= 0) return 0;
  const step = Math.round((dx / width) * count);
  return wrapFrame(startFrame - step, count);
}
