import { describe, it, expect } from 'vitest';
import { spawnParticles, updateParticles } from '../../game.js';

describe('spawnParticles', () => {
  it('creates the specified number of particles', () => {
    const particles = spawnParticles(100, 100, 10);
    expect(particles).toHaveLength(10);
  });

  it('defaults to 22 particles', () => {
    const particles = spawnParticles(100, 100);
    expect(particles).toHaveLength(22);
  });

  it('all particles start at the given position', () => {
    const particles = spawnParticles(50, 75, 5);
    for (const p of particles) {
      expect(p.x).toBe(50);
      expect(p.y).toBe(75);
    }
  });

  it('all particles start with life = 1', () => {
    const particles = spawnParticles(0, 0, 10);
    for (const p of particles) {
      expect(p.life).toBe(1);
    }
  });

  it('all particles have a positive decay rate', () => {
    const particles = spawnParticles(0, 0, 10);
    for (const p of particles) {
      expect(p.decay).toBeGreaterThan(0);
      expect(p.decay).toBeLessThanOrEqual(0.05); // max = 0.03 + 0.02
    }
  });

  it('all particles have a valid color', () => {
    const validColors = ['#e94560', '#ff6b6b', '#c0392b', '#f39c12'];
    const particles = spawnParticles(0, 0, 50);
    for (const p of particles) {
      expect(validColors).toContain(p.color);
    }
  });

  it('particles have radius between 2 and 7', () => {
    const particles = spawnParticles(0, 0, 50);
    for (const p of particles) {
      expect(p.r).toBeGreaterThanOrEqual(2);
      expect(p.r).toBeLessThan(7);
    }
  });
});

describe('updateParticles', () => {
  it('moves particles by their velocity', () => {
    const particles = [
      { x: 10, y: 20, vx: 3, vy: -2, life: 1, decay: 0.01, r: 5, color: '#fff' },
    ];
    updateParticles(particles);
    expect(particles[0].x).toBe(13);
    expect(particles[0].y).toBe(18); // 20 + (-2)
  });

  it('applies gravity to vy', () => {
    const particles = [
      { x: 0, y: 0, vx: 0, vy: 0, life: 1, decay: 0.01, r: 5, color: '#fff' },
    ];
    updateParticles(particles);
    expect(particles[0].vy).toBe(0.15);
  });

  it('decreases life by decay each frame', () => {
    const particles = [
      { x: 0, y: 0, vx: 0, vy: 0, life: 1, decay: 0.05, r: 5, color: '#fff' },
    ];
    updateParticles(particles);
    expect(particles[0].life).toBeCloseTo(0.95);
  });

  it('removes particles when life <= 0', () => {
    const particles = [
      { x: 0, y: 0, vx: 0, vy: 0, life: 0.01, decay: 0.02, r: 5, color: '#fff' },
    ];
    updateParticles(particles);
    expect(particles).toHaveLength(0);
  });

  it('keeps alive particles in the array', () => {
    const particles = [
      { x: 0, y: 0, vx: 0, vy: 0, life: 1, decay: 0.01, r: 5, color: '#fff' },
      { x: 0, y: 0, vx: 0, vy: 0, life: 0.005, decay: 0.01, r: 5, color: '#fff' },
      { x: 0, y: 0, vx: 0, vy: 0, life: 0.8, decay: 0.01, r: 5, color: '#fff' },
    ];
    updateParticles(particles);
    expect(particles).toHaveLength(2);
  });

  it('eventually removes all particles after enough updates', () => {
    const particles = spawnParticles(100, 100, 10);
    for (let i = 0; i < 200; i++) {
      updateParticles(particles);
    }
    expect(particles).toHaveLength(0);
  });

  it('returns the same array reference', () => {
    const particles = [
      { x: 0, y: 0, vx: 0, vy: 0, life: 1, decay: 0.01, r: 5, color: '#fff' },
    ];
    const result = updateParticles(particles);
    expect(result).toBe(particles);
  });
});
