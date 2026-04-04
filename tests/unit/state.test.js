import { describe, it, expect, beforeEach } from 'vitest';
import {
  STATE,
  createGameState,
  INITIAL_SPEED,
  GROUND,
  CANVAS_W,
  rectsOverlap,
  BEER_SLOW_DURATION,
  BEER_SLOW_FACTOR,
  getBeerRect,
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

describe('Beer power-up (slow motion)', () => {
  let game;

  beforeEach(() => {
    game = createGameState();
    game.handleInput(); // start game
  });

  it('starts with empty collectibles and zero beerTimer', () => {
    expect(game.collectibles).toHaveLength(0);
    expect(game.beerTimer).toBe(0);
  });

  it('spawns a beer bottle when nextCollectible reaches 0', () => {
    game.nextCollectible = 1;
    game.nextObstacle = 999;
    game.tick();
    expect(game.collectibles.length).toBeGreaterThanOrEqual(1);
  });

  it('beer bottles spawn off-screen to the right', () => {
    game.nextCollectible = 1;
    game.nextObstacle = 999;
    game.tick();
    const c = game.collectibles[0];
    // Spawned at CANVAS_W + 50, then moved left by speed
    expect(c.x).toBe(CANVAS_W + 50 - game.speed);
  });

  it('beer bottles have a rect getter', () => {
    game.nextCollectible = 1;
    game.nextObstacle = 999;
    game.tick();
    const c = game.collectibles[0];
    const r = c.rect;
    expect(r).toHaveProperty('x');
    expect(r).toHaveProperty('y');
    expect(r).toHaveProperty('w');
    expect(r).toHaveProperty('h');
  });

  it('collecting a beer bottle sets beerTimer to BEER_SLOW_DURATION', () => {
    // Place a beer bottle right on top of the crab
    const crabRect = game.crab.rect;
    game.collectibles.push({
      x: game.crab.x,
      get rect() {
        return { x: crabRect.x, y: crabRect.y, w: crabRect.w, h: crabRect.h };
      },
    });
    game.nextObstacle = 999;
    game.nextCollectible = 999;
    game.tick();
    expect(game.beerTimer).toBe(BEER_SLOW_DURATION);
  });

  it('collecting a beer bottle removes it from collectibles', () => {
    const crabRect = game.crab.rect;
    game.collectibles.push({
      x: game.crab.x,
      get rect() {
        return { x: crabRect.x, y: crabRect.y, w: crabRect.w, h: crabRect.h };
      },
    });
    game.nextObstacle = 999;
    game.nextCollectible = 999;
    game.tick();
    expect(game.collectibles).toHaveLength(0);
  });

  it('collecting a beer does not kill the crab', () => {
    const crabRect = game.crab.rect;
    game.collectibles.push({
      x: game.crab.x,
      get rect() {
        return { x: crabRect.x, y: crabRect.y, w: crabRect.w, h: crabRect.h };
      },
    });
    game.nextObstacle = 999;
    game.nextCollectible = 999;
    const died = game.tick();
    expect(died).toBe(false);
    expect(game.crab.dead).toBe(false);
    expect(game.state).toBe(STATE.RUNNING);
  });

  it('beerTimer decrements each frame', () => {
    game.beerTimer = 100;
    game.nextObstacle = 999;
    game.nextCollectible = 999;
    game.tick();
    expect(game.beerTimer).toBe(99);
  });

  it('beerTimer does not go below 0', () => {
    game.beerTimer = 1;
    game.nextObstacle = 999;
    game.nextCollectible = 999;
    game.tick();
    expect(game.beerTimer).toBe(0);
    game.tick();
    expect(game.beerTimer).toBe(0);
  });

  it('obstacles move slower during slow-mo', () => {
    // Place obstacle at known position, tick without slow-mo
    game.obstacles.push({
      x: 500,
      type: 0,
      get rect() { return { x: this.x - 22, y: GROUND - 36, w: 36, h: 36 }; },
    });
    game.nextObstacle = 999;
    game.nextCollectible = 999;
    game.tick();
    const normalMove = 500 - game.obstacles[0].x;

    // Reset and test with slow-mo
    const game2 = createGameState();
    game2.handleInput();
    game2.beerTimer = 100;
    game2.obstacles.push({
      x: 500,
      type: 0,
      get rect() { return { x: this.x - 22, y: GROUND - 36, w: 36, h: 36 }; },
    });
    game2.nextObstacle = 999;
    game2.nextCollectible = 999;
    game2.tick();
    const slowMove = 500 - game2.obstacles[0].x;

    expect(slowMove).toBeLessThan(normalMove);
    expect(slowMove).toBeCloseTo(normalMove * BEER_SLOW_FACTOR, 1);
  });

  it('speed returns to normal when beerTimer expires', () => {
    game.obstacles.push({
      x: 500,
      type: 0,
      get rect() { return { x: this.x - 22, y: GROUND - 36, w: 36, h: 36 }; },
    });
    game.beerTimer = 0; // no slow-mo
    game.nextObstacle = 999;
    game.nextCollectible = 999;
    const xBefore = game.obstacles[0].x;
    game.tick();
    const moveNormal = xBefore - game.obstacles[0].x;
    // Should move at full speed (game.speed)
    expect(moveNormal).toBeCloseTo(game.speed, 1);
  });

  it('reset() clears collectibles, beerTimer, and nextCollectible', () => {
    game.collectibles.push({ x: 100 });
    game.beerTimer = 200;
    game.nextCollectible = 50;
    game.reset();
    expect(game.collectibles).toHaveLength(0);
    expect(game.beerTimer).toBe(0);
    expect(game.nextCollectible).toBe(200);
  });

  it('removes beer bottles that go off-screen left', () => {
    game.collectibles.push({
      x: -56,
      get rect() { return getBeerRect(this.x); },
    });
    game.nextObstacle = 999;
    game.nextCollectible = 999;
    game.tick();
    expect(game.collectibles).toHaveLength(0);
  });

  it('collecting a second beer resets the timer to full duration', () => {
    game.beerTimer = 50; // already in slow-mo with 50 frames left
    const crabRect = game.crab.rect;
    game.collectibles.push({
      x: game.crab.x,
      get rect() {
        return { x: crabRect.x, y: crabRect.y, w: crabRect.w, h: crabRect.h };
      },
    });
    game.nextObstacle = 999;
    game.nextCollectible = 999;
    game.tick();
    // beerTimer was decremented by 1 (to 49), then reset to BEER_SLOW_DURATION
    expect(game.beerTimer).toBe(BEER_SLOW_DURATION);
  });
});
