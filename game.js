// ─── Constants ────────────────────────────────────────────────────────────────
export const CANVAS_W = 800;
export const CANVAS_H = 220;
export const GROUND = CANVAS_H - 30; // 190
export const GRAVITY = 0.55;
export const INITIAL_SPEED = 5;
export const MAX_SPEED = 14;
export const MAX_JUMPS = 2;
export const JUMP_VELOCITY = -12.5;
export const BEER_SLOW_DURATION = 300; // ~5 seconds at 60fps
export const BEER_SLOW_FACTOR = 0.4;   // speed drops to 40%

// ─── State machine ───────────────────────────────────────────────────────────
export const STATE = Object.freeze({
  IDLE: 0,
  RUNNING: 1,
  DEAD: 2,
});

// ─── Score formatting ─────────────────────────────────────────────────────────
export function formatScore(n) {
  return String(Math.floor(n)).padStart(5, '0');
}

// ─── Speed calculation ────────────────────────────────────────────────────────
export function calculateSpeed(score) {
  const speed = INITIAL_SPEED + Math.floor(score / 200) * 0.5;
  return Math.min(speed, MAX_SPEED);
}

// ─── Next obstacle cooldown ───────────────────────────────────────────────────
export function calculateNextObstacle(score) {
  const base = 60 + Math.random() * 90 - Math.floor(score / 500) * 5;
  return Math.max(40, base);
}

// ─── Collision detection ──────────────────────────────────────────────────────
export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// ─── Crab factory ─────────────────────────────────────────────────────────────
export function createCrab(config = {}) {
  const ground = config.ground ?? GROUND;
  const gravity = config.gravity ?? GRAVITY;
  const maxJumps = config.maxJumps ?? MAX_JUMPS;
  const jumpVelocity = config.jumpVelocity ?? JUMP_VELOCITY;

  return {
    x: config.x ?? 90,
    y: ground,
    w: 44,
    h: 30,
    vy: 0,
    jumps: 0,
    maxJumps,
    legPhase: 0,
    dead: false,

    // Derived config (stored for reference in update)
    _ground: ground,
    _gravity: gravity,
    _jumpVelocity: jumpVelocity,

    jump() {
      if (this.jumps < this.maxJumps) {
        this.vy = this._jumpVelocity;
        this.jumps++;
        return true;
      }
      return false;
    },

    update() {
      this.vy += this._gravity;
      this.y += this.vy;
      if (this.y >= this._ground) {
        this.y = this._ground;
        this.vy = 0;
        this.jumps = 0;
      }
      if (!this.dead) this.legPhase += 0.25;
    },

    get rect() {
      return {
        x: this.x - this.w / 2 + 6,
        y: this.y - this.h,
        w: this.w - 12,
        h: this.h - 4,
      };
    },

    reset() {
      this.y = this._ground;
      this.vy = 0;
      this.jumps = 0;
      this.dead = false;
      this.legPhase = 0;
    },
  };
}

// ─── Obstacle type weights ────────────────────────────────────────────────────
// Types: 0=rock, 1=seaweed, 2=shell, 3=coral, 4=llama, 5=elephant
export const OBSTACLE_TYPE_COUNT = 6;

/**
 * Returns an obstacle type index using weighted random selection.
 * elephant ~5%, llama ~35%, others (rock/seaweed/shell/coral) ~60%
 * @param {number} [roll] - optional random value [0,1) for testability
 */
export function pickObstacleType(roll = Math.random()) {
  if (roll < 0.05) return 5;          // baby elephant (rare)
  if (roll < 0.40) return 4;          // llama (~35%)
  // Distribute remaining 60% evenly across 4 basic types (0-3)
  const normalized = (roll - 0.40) / 0.60; // [0, 1)
  return Math.min(Math.floor(normalized * 4), 3); // clamp to 0-3
}

// ─── Obstacle rect factories (logic only, no drawing) ─────────────────────────
export function getObstacleRect(type, x, ground = GROUND) {
  switch (type) {
    case 0: // rock
      return { x: x - 22, y: ground - 36, w: 36, h: 36 };
    case 1: // seaweed
      return { x: x - 14, y: ground - 42, w: 28, h: 42 };
    case 2: // shell
      return { x: x - 14, y: ground - 20, w: 28, h: 20 };
    case 3: // coral
      return { x: x - 10, y: ground - 50, w: 20, h: 50 };
    case 4: // llama
      return { x: x - 20, y: ground - 68, w: 52, h: 68 };
    case 5: // elephant
      return { x: x - 25, y: ground - 63, w: 56, h: 63 };
    default:
      return { x: x - 10, y: ground - 30, w: 20, h: 30 };
  }
}

// ─── Beer bottle rect (collectible) ───────────────────────────────────────
export function getBeerRect(x, ground = GROUND) {
  return { x: x - 9, y: ground - 40, w: 18, h: 40 };
}

// ─── Next collectible cooldown ────────────────────────────────────────────
export function calculateNextCollectible(score) {
  const base = 200 + Math.random() * 150 - Math.floor(score / 500) * 10;
  return Math.max(120, base);
}

// ─── Particles ────────────────────────────────────────────────────────────────
const PARTICLE_COLORS = ['#e94560', '#ff6b6b', '#c0392b', '#f39c12'];

export function spawnParticles(x, y, count = 22) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 4 + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 2,
      life: 1,
      decay: Math.random() * 0.03 + 0.02,
      r: Math.random() * 5 + 2,
      color: PARTICLE_COLORS[Math.floor(Math.random() * 4)],
    });
  }
  return particles;
}

export function updateParticles(particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= p.decay;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
  return particles;
}

// ─── Game state factory ───────────────────────────────────────────────────────
export function createGameState(config = {}) {
  const crab = createCrab(config);

  return {
    crab,
    state: STATE.IDLE,
    score: 0,
    hiScore: 0,
    frames: 0,
    speed: INITIAL_SPEED,
    obstacles: [],
    collectibles: [],
    particles: [],
    nextObstacle: 80,
    nextCollectible: 200,
    beerTimer: 0,

    reset() {
      this.crab.reset();
      this.obstacles.length = 0;
      this.collectibles.length = 0;
      this.particles.length = 0;
      this.score = 0;
      this.frames = 0;
      this.speed = INITIAL_SPEED;
      this.nextObstacle = 80;
      this.nextCollectible = 200;
      this.beerTimer = 0;
      this.state = STATE.RUNNING;
    },

    handleInput() {
      if (this.state === STATE.IDLE || this.state === STATE.DEAD) {
        this.reset();
        return 'reset';
      }
      if (this.state === STATE.RUNNING) {
        return this.crab.jump() ? 'jump' : 'no-jump';
      }
      return 'none';
    },

    /**
     * Advance game by one frame. Returns true if crab died this frame.
     */
    tick() {
      if (this.state !== STATE.RUNNING) return false;

      this.frames++;
      this.score += 0.1 * (1 + this.frames / 3000);
      this.speed = calculateSpeed(this.score);

      // Beer slow-motion effect
      if (this.beerTimer > 0) this.beerTimer--;
      const effectiveSpeed = this.beerTimer > 0
        ? this.speed * BEER_SLOW_FACTOR
        : this.speed;

      // Obstacle spawn
      this.nextObstacle--;
      if (this.nextObstacle <= 0) {
        const typeIdx = pickObstacleType();
        this.obstacles.push({
          x: CANVAS_W + 50,
          type: typeIdx,
          get rect() {
            return getObstacleRect(this.type, this.x);
          },
        });
        this.nextObstacle = calculateNextObstacle(this.score);
      }

      // Collectible spawn
      this.nextCollectible--;
      if (this.nextCollectible <= 0) {
        this.collectibles.push({
          x: CANVAS_W + 50,
          get rect() {
            return getBeerRect(this.x);
          },
        });
        this.nextCollectible = calculateNextCollectible(this.score);
      }

      // Move obstacles & check collision
      let died = false;
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.x -= effectiveSpeed;
        if (obs.x < -60) {
          this.obstacles.splice(i, 1);
          continue;
        }
        if (rectsOverlap(this.crab.rect, obs.rect)) {
          this.crab.dead = true;
          this.particles.push(...spawnParticles(this.crab.x, this.crab.y - this.crab.h / 2));
          this.hiScore = Math.max(this.hiScore, Math.floor(this.score));
          this.state = STATE.DEAD;
          died = true;
        }
      }

      // Move collectibles & check collection
      for (let i = this.collectibles.length - 1; i >= 0; i--) {
        const c = this.collectibles[i];
        c.x -= effectiveSpeed;
        if (c.x < -60) {
          this.collectibles.splice(i, 1);
          continue;
        }
        if (rectsOverlap(this.crab.rect, c.rect)) {
          this.collectibles.splice(i, 1);
          this.beerTimer = BEER_SLOW_DURATION;
        }
      }

      this.crab.update();
      updateParticles(this.particles);

      return died;
    },
  };
}
