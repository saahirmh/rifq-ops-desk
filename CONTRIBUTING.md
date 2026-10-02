# Contributing

Rifq Ops Desk is a public showcase from the Rifq team at Saba Technologies Ltd. Changes should keep the sample cycle honest and runnable.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000 and run **Corridor brief**. No API key is required.

## Checks

```bash
npm test
npm run lint
npm run build
```

CI runs the same three commands.

## Desk policy

- Fixture copy stays labeled as sample data. Do not add client names, logos, revenue, or usage numbers.
- The router must not gain an automatic send for billing, scheduling, or unclassified notes.
- A research reply exists only after `verifyClaims` accepts the lines that go into it.
- New tools belong on an agent's `tools` list. The engine rejects a call the roster did not grant.
- Do not commit secrets. `.env.example` documents the unused provider slot.

## Layout

Orchestration rules live in `src/lib/orchestration` and are covered by Vitest. The Next.js route handlers call that same code. The desk UI plays a returned plan back; it does not reimplement routing or QA.
