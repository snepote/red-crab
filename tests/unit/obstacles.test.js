import { describe, it, expect } from 'vitest';
import {
  pickObstacleType,
  getObstacleRect,
  GROUND,
  OBSTACLE_TYPE_COUNT,
} from '../../game.js';

describe('pickObstacleType', () => {
  it('returns elephant (5) when roll < 0.05', () => {
    expect(pickObstacleType(0)).toBe(5);
    expect(pickObstacleType(0.01)).toBe(5);
    expect(pickObstacleType(0.049)).toBe(5);
  });

  it('returns llama (4) when 0.05 <= roll < 0.40', () => {
    expect(pickObstacleType(0.05)).toBe(4);
    expect(pickObstacleType(0.20)).toBe(4);
    expect(pickObstacleType(0.399)).toBe(4);
  });

  it('returns one of the basic obstacles (0-3) when roll >= 0.40', () => {
    // Use exact boundary values that avoid floating-point ambiguity
    expect(pickObstacleType(0.40)).toBe(0);  // rock: normalized ≈ 0
    expect(pickObstacleType(0.55)).toBe(1);  // seaweed: normalized ≈ 0.25
    expect(pickObstacleType(0.85)).toBe(3);  // coral: normalized = 0.75
    expect(pickObstacleType(0.99)).toBe(3);  // coral: near-max
  });

  it('distributes all four basic types across the range', () => {
    // Verify each basic type is reachable by picking values well within each quarter
    const types = new Set();
    for (let roll = 0.41; roll < 1.0; roll += 0.01) {
      types.add(pickObstacleType(roll));
    }
    expect(types.has(0)).toBe(true);
    expect(types.has(1)).toBe(true);
    expect(types.has(2)).toBe(true);
    expect(types.has(3)).toBe(true);
  });

  it('never returns a value outside 0-5', () => {
    for (let r = 0; r < 1; r += 0.01) {
      const type = pickObstacleType(r);
      expect(type).toBeGreaterThanOrEqual(0);
      expect(type).toBeLessThan(OBSTACLE_TYPE_COUNT);
    }
  });

  it('defaults to Math.random when no roll provided', () => {
    const type = pickObstacleType();
    expect(type).toBeGreaterThanOrEqual(0);
    expect(type).toBeLessThan(OBSTACLE_TYPE_COUNT);
  });
});

describe('getObstacleRect', () => {
  const x = 400;

  it('returns correct rect for rock (type 0)', () => {
    const r = getObstacleRect(0, x);
    expect(r).toEqual({ x: x - 22, y: GROUND - 36, w: 36, h: 36 });
  });

  it('returns correct rect for seaweed (type 1)', () => {
    const r = getObstacleRect(1, x);
    expect(r).toEqual({ x: x - 14, y: GROUND - 42, w: 28, h: 42 });
  });

  it('returns correct rect for shell (type 2)', () => {
    const r = getObstacleRect(2, x);
    expect(r).toEqual({ x: x - 14, y: GROUND - 20, w: 28, h: 20 });
  });

  it('returns correct rect for coral (type 3)', () => {
    const r = getObstacleRect(3, x);
    expect(r).toEqual({ x: x - 10, y: GROUND - 50, w: 20, h: 50 });
  });

  it('returns correct rect for llama (type 4)', () => {
    const r = getObstacleRect(4, x);
    expect(r).toEqual({ x: x - 20, y: GROUND - 68, w: 52, h: 68 });
  });

  it('returns correct rect for elephant (type 5)', () => {
    const r = getObstacleRect(5, x);
    expect(r).toEqual({ x: x - 25, y: GROUND - 63, w: 56, h: 63 });
  });

  it('returns a default rect for unknown type', () => {
    const r = getObstacleRect(99, x);
    expect(r).toEqual({ x: x - 10, y: GROUND - 30, w: 20, h: 30 });
  });

  it('all obstacle rects sit on the ground (bottom edge = ground)', () => {
    for (let type = 0; type < OBSTACLE_TYPE_COUNT; type++) {
      const r = getObstacleRect(type, x);
      expect(r.y + r.h).toBe(GROUND);
    }
  });

  it('accepts custom ground parameter', () => {
    const customGround = 100;
    const r = getObstacleRect(0, x, customGround);
    expect(r.y + r.h).toBe(customGround);
  });
});
