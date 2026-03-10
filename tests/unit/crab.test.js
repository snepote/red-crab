import { describe, it, expect, beforeEach } from 'vitest';
import { createCrab, GROUND, GRAVITY, JUMP_VELOCITY } from '../../game.js';

describe('Crab', () => {
  let crab;

  beforeEach(() => {
    crab = createCrab();
  });

  describe('initial state', () => {
    it('starts at ground level', () => {
      expect(crab.y).toBe(GROUND);
    });

    it('starts with zero velocity', () => {
      expect(crab.vy).toBe(0);
    });

    it('starts with zero jumps used', () => {
      expect(crab.jumps).toBe(0);
    });

    it('starts alive', () => {
      expect(crab.dead).toBe(false);
    });

    it('has expected dimensions', () => {
      expect(crab.w).toBe(44);
      expect(crab.h).toBe(30);
    });
  });

  describe('jump()', () => {
    it('applies jump velocity on first jump', () => {
      const result = crab.jump();
      expect(result).toBe(true);
      expect(crab.vy).toBe(JUMP_VELOCITY);
      expect(crab.jumps).toBe(1);
    });

    it('allows a second jump (double jump)', () => {
      crab.jump();
      const result = crab.jump();
      expect(result).toBe(true);
      expect(crab.vy).toBe(JUMP_VELOCITY);
      expect(crab.jumps).toBe(2);
    });

    it('rejects a third jump', () => {
      crab.jump();
      crab.jump();
      const result = crab.jump();
      expect(result).toBe(false);
      expect(crab.jumps).toBe(2);
    });

    it('resets velocity on double jump regardless of current vy', () => {
      crab.jump();
      // Simulate some falling
      crab.vy = 5;
      const result = crab.jump();
      expect(result).toBe(true);
      expect(crab.vy).toBe(JUMP_VELOCITY);
    });
  });

  describe('update()', () => {
    it('applies gravity each frame', () => {
      crab.jump();
      const vyAfterJump = crab.vy;
      crab.update();
      expect(crab.vy).toBe(vyAfterJump + GRAVITY);
    });

    it('moves crab upward when vy is negative', () => {
      crab.jump();
      const yBefore = crab.y;
      crab.update();
      expect(crab.y).toBeLessThan(yBefore);
    });

    it('clamps position to ground level', () => {
      // crab starts at ground, with zero vy, update should keep it there
      crab.update();
      expect(crab.y).toBe(GROUND);
      expect(crab.vy).toBe(0);
    });

    it('resets jump counter on landing', () => {
      crab.jump();
      crab.jumps = 2;
      // Simulate enough updates to land
      for (let i = 0; i < 200; i++) {
        crab.update();
        if (crab.y >= GROUND) break;
      }
      expect(crab.y).toBe(GROUND);
      expect(crab.jumps).toBe(0);
    });

    it('advances legPhase when alive', () => {
      const phaseBefore = crab.legPhase;
      crab.update();
      expect(crab.legPhase).toBe(phaseBefore + 0.25);
    });

    it('does not advance legPhase when dead', () => {
      crab.dead = true;
      const phaseBefore = crab.legPhase;
      crab.update();
      expect(crab.legPhase).toBe(phaseBefore);
    });

    it('crab follows a parabolic arc (rises then falls)', () => {
      crab.jump();
      const positions = [];
      for (let i = 0; i < 60; i++) {
        crab.update();
        positions.push(crab.y);
      }
      // Find the peak (minimum y value since y-axis is inverted)
      const peak = Math.min(...positions);
      expect(peak).toBeLessThan(GROUND);
      // Should eventually return to ground
      expect(positions[positions.length - 1]).toBe(GROUND);
    });
  });

  describe('rect (hitbox)', () => {
    it('returns a narrower rect than the full sprite width', () => {
      const r = crab.rect;
      expect(r.w).toBe(crab.w - 12); // 32
      expect(r.h).toBe(crab.h - 4);  // 26
    });

    it('is centered on crab.x with inset', () => {
      const r = crab.rect;
      expect(r.x).toBe(crab.x - crab.w / 2 + 6);
    });

    it('top of rect is above crab.y by crab height', () => {
      const r = crab.rect;
      expect(r.y).toBe(crab.y - crab.h);
    });
  });

  describe('reset()', () => {
    it('restores crab to initial state', () => {
      crab.jump();
      crab.jump();
      crab.dead = true;
      crab.legPhase = 99;
      crab.update();

      crab.reset();

      expect(crab.y).toBe(GROUND);
      expect(crab.vy).toBe(0);
      expect(crab.jumps).toBe(0);
      expect(crab.dead).toBe(false);
      expect(crab.legPhase).toBe(0);
    });
  });

  describe('custom config', () => {
    it('respects custom ground level', () => {
      const customCrab = createCrab({ ground: 100 });
      expect(customCrab.y).toBe(100);
      expect(customCrab._ground).toBe(100);
    });

    it('respects custom gravity', () => {
      const customCrab = createCrab({ gravity: 1.0 });
      customCrab.jump();
      customCrab.update();
      expect(customCrab.vy).toBe(JUMP_VELOCITY + 1.0);
    });

    it('respects custom maxJumps', () => {
      const tripleJumper = createCrab({ maxJumps: 3 });
      expect(tripleJumper.jump()).toBe(true);
      expect(tripleJumper.jump()).toBe(true);
      expect(tripleJumper.jump()).toBe(true);
      expect(tripleJumper.jump()).toBe(false);
    });
  });
});
