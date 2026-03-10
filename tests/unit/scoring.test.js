import { describe, it, expect } from 'vitest';
import {
  formatScore,
  calculateSpeed,
  calculateNextObstacle,
  INITIAL_SPEED,
  MAX_SPEED,
} from '../../game.js';

describe('formatScore', () => {
  it('formats zero as "00000"', () => {
    expect(formatScore(0)).toBe('00000');
  });

  it('pads small numbers with leading zeros', () => {
    expect(formatScore(1)).toBe('00001');
    expect(formatScore(42)).toBe('00042');
    expect(formatScore(999)).toBe('00999');
  });

  it('formats a 5-digit number without padding', () => {
    expect(formatScore(12345)).toBe('12345');
  });

  it('handles numbers larger than 5 digits', () => {
    expect(formatScore(100000)).toBe('100000');
  });

  it('floors fractional scores', () => {
    expect(formatScore(3.7)).toBe('00003');
    expect(formatScore(99.99)).toBe('00099');
  });

  it('handles negative numbers', () => {
    // Math.floor(-0.5) = -1, padStart(5, '0') on "-1" = "000-1"
    expect(formatScore(-0.5)).toBe('000-1');
  });
});

describe('calculateSpeed', () => {
  it('returns initial speed at score 0', () => {
    expect(calculateSpeed(0)).toBe(INITIAL_SPEED);
  });

  it('increases speed by 0.5 for every 200 score', () => {
    expect(calculateSpeed(200)).toBe(INITIAL_SPEED + 0.5);
    expect(calculateSpeed(400)).toBe(INITIAL_SPEED + 1.0);
    expect(calculateSpeed(600)).toBe(INITIAL_SPEED + 1.5);
  });

  it('does not increase between milestones', () => {
    expect(calculateSpeed(199)).toBe(INITIAL_SPEED);
    expect(calculateSpeed(50)).toBe(INITIAL_SPEED);
  });

  it('caps at MAX_SPEED', () => {
    expect(calculateSpeed(100000)).toBe(MAX_SPEED);
  });

  it('returns MAX_SPEED at the exact threshold', () => {
    // speed = 5 + floor(score/200) * 0.5, capped at 14
    // 14 = 5 + x*0.5 => x = 18 => score = 18*200 = 3600
    expect(calculateSpeed(3600)).toBe(MAX_SPEED);
  });

  it('speed just below max is less than MAX_SPEED', () => {
    expect(calculateSpeed(3400)).toBeLessThan(MAX_SPEED);
  });
});

describe('calculateNextObstacle', () => {
  it('returns a value of at least 40', () => {
    for (let i = 0; i < 100; i++) {
      expect(calculateNextObstacle(99999)).toBeGreaterThanOrEqual(40);
    }
  });

  it('returns a value in the expected range at score 0', () => {
    for (let i = 0; i < 100; i++) {
      const val = calculateNextObstacle(0);
      // base = 60 + [0,90) - 0 = [60, 150)
      expect(val).toBeGreaterThanOrEqual(60);
      expect(val).toBeLessThan(150);
    }
  });

  it('obstacle cooldown decreases at higher scores', () => {
    // At high scores, the subtraction term grows, so the range shifts down
    // base = 60 + [0,90) - floor(5000/500)*5 = 60 + [0,90) - 50 = [10, 100)
    // clamped to [40, 100)
    const results = [];
    for (let i = 0; i < 200; i++) {
      results.push(calculateNextObstacle(5000));
    }
    const avg = results.reduce((a, b) => a + b, 0) / results.length;
    // Average should be lower than at score 0 (which averages ~105)
    expect(avg).toBeLessThan(100);
  });
});
