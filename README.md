# Red Crab

[![CI](https://github.com/snepote/red-crab/actions/workflows/ci.yml/badge.svg)](https://github.com/snepote/red-crab/actions/workflows/ci.yml)

A Chrome dino-style endless runner browser game. You play as a crowned crab running along the ocean floor, jumping over obstacles to survive as long as possible.

**Play it live:** [red-crab.nepoteidea.com](https://red-crab.nepoteidea.com/)

## How to Play

### Controls

- **Space** or **Arrow Up** -- Jump
- **Tap / Click** the canvas -- Jump (mobile friendly)
- Double jump is allowed (jump again while airborne)

### Obstacles

Rocks, seaweed, shells, coral, llamas, and the rare baby pink elephant. Hit any of them and it's game over.

### Scoring

Score increases automatically while running. Speed ramps up over time. Your high score is tracked for the session.

## Running the Game

The game uses ES modules, so it **must be served over HTTP** -- double-clicking `index.html` will not work. No build step is needed; just start a local server.

### Quick start

```bash
npm install
npm start
```

Open http://localhost:3000 in your browser.

### Alternative: Python

```bash
python3 -m http.server 8000
```

Open http://localhost:8000.

> **Why can't I just open `index.html`?**
> Browsers block ES module `import` statements over the `file://` protocol. Any local HTTP server resolves this.

## Running Tests

Install dependencies first:

```bash
npm install
npx playwright install chromium
```

### Unit tests (Vitest)

```bash
npm test
```

109 tests covering collision detection, crab physics, scoring, obstacle spawning, particles, and game state transitions.

### Integration tests (Playwright)

```bash
npm run test:e2e
```

12 tests verifying the full game in a real browser -- page structure, input handling, score updates, and gameplay flow.

### All tests

```bash
npm run test:all
```

## Project Structure

```
index.html            Game UI, rendering, and main loop
game.js               Game logic module (physics, collision, state machine)
tests/
  unit/
    collision.test.js  AABB collision detection
    crab.test.js       Crab physics and jump mechanics
    scoring.test.js    Score formatting, speed ramp, obstacle cooldown
    obstacles.test.js  Spawn weighting and hitbox geometry
    particles.test.js  Death particle lifecycle
    state.test.js      Game state machine and tick loop
  e2e/
    game.spec.js       Playwright integration tests
vitest.config.js       Vitest configuration
playwright.config.js   Playwright configuration
```
