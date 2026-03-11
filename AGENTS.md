# Red Crab - Project Instructions

## Project Overview

Red Crab is a Chrome dino-style endless runner browser game deployed to Cloudflare Workers/Pages.

## Testing Policy

After every code change, all tests must pass before the task is considered complete.

Run all tests:

    npm run test:all

This runs both unit tests (vitest) and e2e tests (playwright) sequentially.

Individual test commands:
- Unit tests: `npm run test:unit`
- E2E tests: `npm run test:e2e`

If any test fails, fix the issue before finishing.

## Build & Deploy

- Build: `npm run build`
- Deploy: `npm run deploy` (runs wrangler deploy)
- Local preview: `npm run preview`
