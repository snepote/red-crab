import { describe, it, expect } from 'vitest';
import { rectsOverlap } from '../../game.js';

describe('rectsOverlap', () => {
  it('returns true when two rects overlap', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 5, y: 5, w: 10, h: 10 };
    expect(rectsOverlap(a, b)).toBe(true);
  });

  it('returns true when one rect is inside the other', () => {
    const outer = { x: 0, y: 0, w: 100, h: 100 };
    const inner = { x: 20, y: 20, w: 10, h: 10 };
    expect(rectsOverlap(outer, inner)).toBe(true);
    expect(rectsOverlap(inner, outer)).toBe(true);
  });

  it('returns false when rects are separated horizontally', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 20, y: 0, w: 10, h: 10 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it('returns false when rects are separated vertically', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 0, y: 20, w: 10, h: 10 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it('returns false when rects share an edge (touching but not overlapping)', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const right = { x: 10, y: 0, w: 10, h: 10 };
    expect(rectsOverlap(a, right)).toBe(false);

    const below = { x: 0, y: 10, w: 10, h: 10 };
    expect(rectsOverlap(a, below)).toBe(false);
  });

  it('returns false when rects share a corner', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 10, y: 10, w: 10, h: 10 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it('returns true with minimal overlap (1 pixel)', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 9, y: 9, w: 10, h: 10 };
    expect(rectsOverlap(a, b)).toBe(true);
  });

  it('handles negative coordinates', () => {
    const a = { x: -10, y: -10, w: 15, h: 15 };
    const b = { x: -5, y: -5, w: 10, h: 10 };
    expect(rectsOverlap(a, b)).toBe(true);
  });

  it('returns true when a zero-size point is inside another rect', () => {
    // A zero-width/height rect at (5,5) still has its left edge at 5
    // and right edge at 5, so 5 < 10 and 0 < 5 — overlap is true.
    // This is consistent with standard AABB: a degenerate rect is a point.
    const a = { x: 5, y: 5, w: 0, h: 0 };
    const b = { x: 0, y: 0, w: 10, h: 10 };
    expect(rectsOverlap(a, b)).toBe(true);
  });

  it('returns false when a zero-size point is outside another rect', () => {
    const a = { x: 15, y: 15, w: 0, h: 0 };
    const b = { x: 0, y: 0, w: 10, h: 10 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it('is commutative (order of arguments does not matter)', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 };
    const b = { x: 5, y: 5, w: 10, h: 10 };
    expect(rectsOverlap(a, b)).toBe(rectsOverlap(b, a));
  });
});
