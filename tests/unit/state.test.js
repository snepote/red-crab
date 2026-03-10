import { describe, it, expect, beforeEach } from 'vitest';
import {
  STATE,
  createGameState,
  INITIAL_SPEED,
  GROUND,
  CANVAS_W,
  rectsOverlap,
} from '../../game.js';

describe('Game State Machine', () => {
  let game;

  beforeEach(() => {
    game = createGameState();
  });

  describe('initial state', () => {
    it('starts in IDLE state', () => {
      expect(game.state).toBe(STATE.IDLE);
    });

    it('starts with zero score', () => {
      expect(game.score).toBe(0);
    });

    it('starts with zero hiScore', () => {
      expect(game.hiScore).toBe(0);
    });

    it('starts with initial speed', () => {
      expect(game.speed).toBe(INITIAL_SPEED);
    });

    it('starts with no obstacles', () => {
      expect(game.obstacles).toHaveLength(0);
    });

    it('starts with no particles', () => {
      expect(game.particles).toHaveLength(0);
    });
  });

  describe('state transitions', () => {
    it('IDLE -> RUNNING on handleInput', () => {
      const result = game.handleInput();
      expect(result).toBe('reset');
      expect(game.state).toBe(STATE.RUNNING);
    });

    it('RUNNING -> jump on handleInput', () => {
      game.handleInput(); // start
      const result = game.handleInput(); // jump
      expect(result).toBe('jump');
      expect(game.state).toBe(STATE.RUNNING);
    });

    it('RUNNING -> no-jump when jumps exhausted', () => {
      game.handleInput(); // start
      game.handleInput(); // jump 1
      game.handleInput(); // jump 2
      const result = game.handleInput(); // no more jumps
      expect(result).toBe('no-jump');
    });

    it('DEAD -> RUNNING on handleInput (restart)', () => {
      game.handleInput(); // start
      // Force death
      game.state = STATE.DEAD;
      game.crab.dead = true;
      const result = game.handleInput();
      expect(result).toBe('reset');
      expect(game.state).toBe(STATE.RUNNING);
      expect(game.crab.dead).toBe(false);
    });
  });

  describe('reset()', () => {
    it('clears score but preserves hiScore', () => {
      game.handleInput(); // start
      game.score = 500;
      game.hiScore = 500;
      game.reset();
      expect(game.score).toBe(0);
      expect(game.hiScore).toBe(500);
    });

    it('clears obstacles and particles', () => {
      game.obstacles.push({ x: 100, type: 0 });
      game.particles.push({ x: 0, y: 0 });
      game.reset();
      expect(game.obstacles).toHaveLength(0);
      expect(game.particles).toHaveLength(0);
    });

    it('resets speed and frame counter', () => {
      game.speed = 10;
      game.frames = 999;
      game.reset();
      expect(game.speed).toBe(INITIAL_SPEED);
      expect(game.frames).toBe(0);
    });

    it('transitions to RUNNING state', () => {
      game.reset();
      expect(game.state).toBe(STATE.RUNNING);
    });
  });

  describe('tick()', () => {
    beforeEach(() => {
      game.handleInput(); // start game
    });

    it('does nothing when not RUNNING', () => {
      game.state = STATE.IDLE;
      const result = game.tick();
      expect(result).toBe(false);
      expect(game.frames).toBe(0);
    });

    it('increments frame counter', () => {
      game.tick();
      expect(game.frames).toBe(1);
    });

    it('increases score each frame', () => {
      game.tick();
      expect(game.score).toBeGreaterThan(0);
    });

    it('score increases over multiple frames', () => {
      for (let i = 0; i < 10; i++) game.tick();
      const score10 = game.score;
      for (let i = 0; i < 10; i++) game.tick();
      expect(game.score).toBeGreaterThan(score10);
    });

    it('updates speed based on score', () => {
      // Manually set high score to test speed
      game.score = 400;
      game.tick();
      expect(game.speed).toBeGreaterThan(INITIAL_SPEED);
    });

    it('decrements nextObstacle counter', () => {
      game.nextObstacle = 50;
      game.tick();
      expect(game.nextObstacle).toBeLessThan(50);
    });

    it('spawns an obstacle when nextObstacle reaches 0', () => {
      game.nextObstacle = 1;
      game.tick();
      expect(game.obstacles.length).toBeGreaterThanOrEqual(1);
    });

    it('obstacles spawn off-screen to the right', () => {
      game.nextObstacle = 1;
      game.tick();
      const obs = game.obstacles[0];
      // Obstacle spawns at CANVAS_W + 50, then moves left by speed in the same tick
      expect(obs.x).toBe(CANVAS_W + 50 - game.speed);
    });

    it('moves obstacles to the left each frame', () => {
      game.obstacles.push({
        x: 500,
        type: 0,
        get rect() { return { x: this.x - 22, y: GROUND - 36, w: 36, h: 36 }; },
      });
      game.nextObstacle = 999; // prevent additional spawns
      game.tick();
      expect(game.obstacles[0].x).toBeLessThan(500);
    });

    it('removes obstacles that go off-screen left', () => {
      // After tick, x becomes -56 - speed. With speed ~5, x ≈ -61 which is < -60
      game.obstacles.push({
        x: -56,
        type: 0,
        get rect() { return { x: this.x - 22, y: GROUND - 36, w: 36, h: 36 }; },
      });
      game.nextObstacle = 999;
      game.tick();
      expect(game.obstacles).toHaveLength(0);
    });

    it('detects collision and transitions to DEAD', () => {
      // Place obstacle right on top of the crab
      const crabRect = game.crab.rect;
      game.obstacles.push({
        x: game.crab.x,
        type: 0,
        get rect() {
          return { x: crabRect.x, y: crabRect.y, w: crabRect.w, h: crabRect.h };
        },
      });
      game.nextObstacle = 999;
      const died = game.tick();
      expect(died).toBe(true);
      expect(game.state).toBe(STATE.DEAD);
      expect(game.crab.dead).toBe(true);
    });

    it('spawns particles on death', () => {
      const crabRect = game.crab.rect;
      game.obstacles.push({
        x: game.crab.x,
        type: 0,
        get rect() {
          return { x: crabRect.x, y: crabRect.y, w: crabRect.w, h: crabRect.h };
        },
      });
      game.nextObstacle = 999;
      game.tick();
      expect(game.particles.length).toBeGreaterThan(0);
    });

    it('updates hiScore on death', () => {
      game.score = 150;
      const crabRect = game.crab.rect;
      game.obstacles.push({
        x: game.crab.x,
        type: 0,
        get rect() {
          return { x: crabRect.x, y: crabRect.y, w: crabRect.w, h: crabRect.h };
        },
      });
      game.nextObstacle = 999;
      game.tick();
      expect(game.hiScore).toBe(Math.floor(game.score));
    });

    it('hiScore only increases, never decreases', () => {
      // First death with score 200
      game.score = 200;
      game.state = STATE.DEAD;
      game.hiScore = Math.max(game.hiScore, 200);

      // Restart and die with lower score
      game.handleInput();
      game.score = 50;
      const crabRect = game.crab.rect;
      game.obstacles.push({
        x: game.crab.x,
        type: 0,
        get rect() {
          return { x: crabRect.x, y: crabRect.y, w: crabRect.w, h: crabRect.h };
        },
      });
      game.nextObstacle = 999;
      game.tick();
      expect(game.hiScore).toBe(200);
    });

    it('updates crab physics each frame', () => {
      game.crab.jump();
      const yBefore = game.crab.y;
      game.nextObstacle = 999;
      game.tick();
      expect(game.crab.y).not.toBe(yBefore);
    });
  });
});

describe('STATE constants', () => {
  it('has distinct values for IDLE, RUNNING, DEAD', () => {
    const values = new Set([STATE.IDLE, STATE.RUNNING, STATE.DEAD]);
    expect(values.size).toBe(3);
  });

  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(STATE)).toBe(true);
  });
});
