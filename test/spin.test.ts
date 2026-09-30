import { describe, expect, it } from 'vitest';
import { frameAfterDrag, wrapFrame } from '@/lib/spin';

describe('wrapFrame', () => {
  it('leaves in-range frames alone', () => {
    expect(wrapFrame(0, 36)).toBe(0);
    expect(wrapFrame(35, 36)).toBe(35);
  });
  it('wraps past the last frame back to the start', () => {
    expect(wrapFrame(36, 36)).toBe(0);
    expect(wrapFrame(40, 36)).toBe(4);
  });
  it('wraps negatives to the end', () => {
    expect(wrapFrame(-1, 36)).toBe(35);
    expect(wrapFrame(-37, 36)).toBe(35);
  });
  it('is safe with no frames', () => {
    expect(wrapFrame(5, 0)).toBe(0);
  });
});

describe('frameAfterDrag', () => {
  it('does not move for a drag shorter than one frame', () => {
    expect(frameAfterDrag(10, 5, 720, 36)).toBe(10);
  });
  it('turns one full revolution across the full width', () => {
    expect(frameAfterDrag(10, 720, 720, 36)).toBe(10);
    expect(frameAfterDrag(10, -720, 720, 36)).toBe(10);
  });
  it('moves proportionally and in opposite directions for left and right', () => {
    // 36 frames over 720px: 20px per frame.
    expect(frameAfterDrag(10, 60, 720, 36)).toBe(7);
    expect(frameAfterDrag(10, -60, 720, 36)).toBe(13);
  });
  it('wraps across frame 0', () => {
    expect(frameAfterDrag(1, 60, 720, 36)).toBe(34);
  });
  it('is safe with a zero-width viewer or no frames', () => {
    expect(frameAfterDrag(3, 100, 0, 36)).toBe(0);
    expect(frameAfterDrag(3, 100, 720, 0)).toBe(0);
  });
});
