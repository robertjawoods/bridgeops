# BridgeOps Agent Guide

This file helps AI coding agents become productive quickly in this monorepo.

## Scope

- Monorepo manager: pnpm 11 workspace + Turborepo 2. Everything is ESM (`"type": "module"`).
- Workspace globs: `apps/*`, `packages/*` (see [pnpm-workspace.yaml](pnpm-workspace.yaml)).
- App surfaces:
  - `apps/web` (package name `web`): SvelteKit 2 / Svelte 5 frontend, Better Auth, Tailwind 4. Acts as the BFF in front of the API.
  - `apps/api` (package name `@bridgeops/api`): Hono API with `@hono/zod-openapi` routes, JWT-verified.
  - `apps/worker` (package name `worker`): BullMQ consumer over Redis.
  - `apps/tests` (package name `tests`): cross-app integration tests.
  - `packages/database` (package name `@bridgeops/database`): Prisma schema, client, migrations.
- Supporting directories: `docker/` (local infrastructure), `scripts/` (project scripts), `.agents/skills/` (repo-local agent skills).

## Architecture at a Glance

```text
browser ──► apps/web (SvelteKit)
              │  Better Auth session (cookies), JWT minted via auth.api.getToken()
              │  remote functions in *.data.remote.ts call the API server-side
              ▼
            apps/api (Hono)
              │  requireAuth verifies the JWT against the web app's JWKS endpoint
              │  workspaceAuthorisation resolves membership for /workspaces/:slug/*
              ├──► packages/database (Prisma ► PostgreSQL)
              └──► BullMQ queue (Redis) ──► apps/worker
```

Key consequence: the API never reads session cookies. It trusts a JWT issued by the web app,
fetched from `${APP_INTERNAL_URL}/api/auth/jwks` and validated with issuer/audience `${APP_URL}`.
The browser never talks to the API directly — the web app is the only client.

## Fast Start Commands

- Install deps: `pnpm install`
- Full dev stack (wraps Turbo in `varlock run`): `pnpm dev`
- Build all: `pnpm build`
- Start built apps: `pnpm start`
- Format all: `pnpm format`
- Generate Prisma client: `pnpm generate`

Package-specific commands:

- Web dev / typecheck / lint: `pnpm --filter web dev` · `pnpm --filter web check` · `pnpm --filter web lint`
- API dev: `pnpm --filter @bridgeops/api dev`
- Worker dev: `pnpm --filter worker dev`
- Prisma generate: `pnpm --filter @bridgeops/database generate`
- Prisma migrate: `pnpm --filter @bridgeops/database migrate`
- Prisma studio / seed: `pnpm --filter @bridgeops/database studio` · `... seed`

### Turbo task coverage (important)

Turbo pipelines only run where a package actually defines the script:

- `lint` → **every package** (`eslint .`). `pnpm lint` runs those via Turbo, then lints
  root-level files (`vitest.config.ts`, `scripts/`) with the root config.
- `format` → **not a Turbo task**. Prettier runs once over the whole repo from the root:
  `pnpm format` (write) / `pnpm format:check` (CI-style check).
- `test` → **no package defines it**, so `pnpm test` is currently a no-op. Run tests with root Vitest (below).
- `build` → api, web, worker, database.

## Testing

Vitest is configured once at the repo root ([vitest.config.ts](vitest.config.ts)) with three projects:

| Project       | Includes                         | Notes                                 |
| ------------- | -------------------------------- | ------------------------------------- |
| `api`         | `apps/api/**/*.test.ts`          | Pure unit tests, no external services |
| `packages`    | `packages/**/*.test.ts`          | Pure unit tests                       |
| `integration` | `apps/tests/integration/**/*.ts` | Boots the Hono app in-process         |

Run them from the repo root:

```bash
pnpm exec vitest run                     # all projects
pnpm exec vitest run --project api       # single project
pnpm exec vitest                         # watch mode
pnpm --filter tests integration          # integration with its env preset
```

Write tests against the injectable factories rather than the live server: `createApp({ rootLogger })`,
`createV1({ queue })`, and `createJobs({ queue })` all accept dependencies so tests can pass a fake
queue or a silent logger. See [apps/tests/integration/index.ts](apps/tests/integration/index.ts) for the pattern.

## Key File Map

Web:

- Auth setup: [apps/web/src/lib/auth/index.ts](apps/web/src/lib/auth/index.ts)
- Auth client: [apps/web/src/lib/auth/client/authClient.ts](apps/web/src/lib/auth/client/authClient.ts)
- Auth request handling + request logging: [apps/web/src/hooks.server.ts](apps/web/src/hooks.server.ts)
- Root session/user propagation: [apps/web/src/routes/+layout.server.ts](apps/web/src/routes/+layout.server.ts)
- Authenticated route guard: [apps/web/src/routes/(authenticated)/+layout.server.ts](<apps/web/src/routes/(authenticated)/+layout.server.ts>)
- Typed API client (Hono RPC): [apps/web/src/lib/api/apiClient.ts](apps/web/src/lib/api/apiClient.ts)
- Locals typing: [apps/web/src/app.d.ts](apps/web/src/app.d.ts)
- Design tokens / global CSS: [apps/web/src/routes/layout.css](apps/web/src/routes/layout.css)
- Web build/runtime config: [apps/web/vite.config.ts](apps/web/vite.config.ts)
- ESLint config: [apps/web/eslint.config.js](apps/web/eslint.config.js) (extends [eslint.config.base.mjs](eslint.config.base.mjs))
- Prettier config: [apps/web/prettier.config.js](apps/web/prettier.config.js) (extends [prettier.config.mjs](prettier.config.mjs))

API:

- Server entry: [apps/api/src/index.ts](apps/api/src/index.ts)
- App factory: [apps/api/src/app.ts](apps/api/src/app.ts)
- Middleware wiring: [apps/api/src/middleware/index.ts](apps/api/src/middleware/index.ts)
- JWT auth middleware: [apps/api/src/middleware/requireAuth.ts](apps/api/src/middleware/requireAuth.ts)
- Workspace authorisation: [apps/api/src/middleware/workspaceAuthorisation.ts](apps/api/src/middleware/workspaceAuthorisation.ts)
- Error type + codes: [apps/api/src/errors/appError.ts](apps/api/src/errors/appError.ts) · [apps/api/src/errors/errorCodes.ts](apps/api/src/errors/errorCodes.ts)
- v1 router: [apps/api/src/v1/index.ts](apps/api/src/v1/index.ts)
- Queue producer: [apps/api/src/v1/jobs/index.ts](apps/api/src/v1/jobs/index.ts)

Worker / data / infra:

- Worker entry: [apps/worker/src/index.ts](apps/worker/src/index.ts)
- DB package entry: [packages/database/src/index.ts](packages/database/src/index.ts)
- Prisma client construction: [packages/database/src/client.ts](packages/database/src/client.ts)
- Prisma config: [packages/database/prisma.config.ts](packages/database/prisma.config.ts)
- Prisma schema: [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)
- Local Redis: [docker/redis/compose.yml](docker/redis/compose.yml)
- Railway tunnel script: [scripts/railway-prisma-tunnel.sh](scripts/railway-prisma-tunnel.sh)
- Turbo pipeline: [turbo.json](turbo.json)
- Root Vitest projects: [vitest.config.ts](vitest.config.ts)

## Local Infrastructure

- Redis (required by the API job producer and the worker):
  `docker compose -f docker/redis/compose.yml up -d`
- PostgreSQL: either a local instance or the Railway tunnel.
  VS Code task **"Railway: Postgres Tunnel + Prisma Env Sync"** runs [scripts/railway-prisma-tunnel.sh](scripts/railway-prisma-tunnel.sh),
  which keeps `packages/database/.env` in sync with the tunnel URL. Do not hand-edit that file.
- Web dev server runs on `5173`; the API defaults to `PORT=3000`.

## Environment + Secrets Rules

- Use Varlock workflows for env handling. The repo-local skill is [.agents/skills/varlock/SKILL.md](.agents/skills/varlock/SKILL.md) — follow it.
- Treat `.env.schema` files as source-of-truth for env contracts:
  - [/.env.schema](.env.schema) — shared `QUEUE_URL`, `QUEUE_NAME`
  - [apps/api/.env.schema](apps/api/.env.schema) — `DATABASE_URL`, `APP_URL`, `APP_INTERNAL_URL`, `PORT`
  - [apps/web/.env.schema](apps/web/.env.schema) — Better Auth, OAuth, Resend, `API_URL`; secrets resolved via the Infisical plugin
  - [apps/worker/.env.schema](apps/worker/.env.schema) — imports queue vars from root
  - [packages/database/.env.schema](packages/database/.env.schema) — `DATABASE_URL`
- Never `cat` `.env`, `.env.local`, or `.env.*.local`. Use `pnpm exec varlock load --agent` to validate (secrets are redacted).
- Never write secret values yourself — ask the user to set them in `.env.local` or Infisical.
- `env.d.ts` files are generated by `@generateTsTypes`. Do not hand-edit them; change the `.env.schema` and reload.
- Adding a new env var means: update the owning `.env.schema`, add it to `passThroughEnv` in [turbo.json](turbo.json) if a Turbo task needs it, then `pnpm exec varlock load --agent`.

## Auth Guardrails

- Better Auth is wired through SvelteKit hooks. Keep `svelteKitHandler(...)` as the request integration point,
  and keep `sveltekitCookies(getRequestEvent)` last in the Better Auth `plugins` array.
- The `jwt()` plugin is what makes API calls work. Removing it breaks every API route.
- Preserve origin normalization in auth config to avoid route mismatch from trailing slashes.
- New dev hosts (ngrok, Railway) must be added to **both** `baseURL.allowedHosts` / `trustedOrigins` in
  [apps/web/src/lib/auth/index.ts](apps/web/src/lib/auth/index.ts) and `server.allowedHosts` in [apps/web/vite.config.ts](apps/web/vite.config.ts).
- When changing auth flow, validate:
  - login/signup form actions and the remote form functions
  - session propagation from `locals` via layout server load
  - callback/origin behavior for localhost and the ngrok host
  - that `apiClient` calls still succeed (JWT issuance is the usual casualty)

## API Conventions

- Routes are declared with `createRoute(...)` from `@hono/zod-openapi` and mounted on an `OpenAPIHono<AppEnv>`.
  Zod schemas live next to the route in a sibling `schemas.ts`.
- Business logic goes in `src/services/<domain>/index.ts`. Route handlers stay thin: validate, pull `userId`
  from context, call the service, shape the response.
- Errors: throw `new AppError(ERROR_CODES.X, message)`. Codes map to HTTP status via `ERROR_STATUS`.
  Do not return ad-hoc error JSON from handlers.
- Middleware order in [apps/api/src/middleware/index.ts](apps/api/src/middleware/index.ts) matters:
  `requestId` → logger child → `requireAuth` on `/api/*` → `workspaceAuthorisation` on `/api/v1/workspaces/:slug/*` → structured logger.
- Everything under `/api/*` is authenticated. `/`, `/healthz`, and `/ready` are public.
- ESM: relative imports **must** include the `.js` extension (`./errors/handle.js`), even from `.ts` sources.
- Any type exported through `BridgeOpsAPI` becomes part of the web app's typed client — adding a route
  automatically makes it available as `apiClient.v1.<path>.$get()` etc.
- Keep factories injectable (`createApp`, `createV1`, `createJobs`, `createQueue`) so tests can substitute dependencies.

## Web Conventions

- Data access uses **SvelteKit remote functions** (`experimental.remoteFunctions` is enabled in
  [apps/web/vite.config.ts](apps/web/vite.config.ts)). Put them in `data.remote.ts` next to the route:
  - `query(...)` for reads
  - `form(zodSchema, handler)` for mutations
- The standard remote-function shape is: `getRequestEvent()` → `auth.api.getToken({ headers })` →
  `createApiClient(token)` → call the typed client → log + `error(...)` on failure. Follow
  [apps/web/src/routes/(authenticated)/workspaces/data.remote.ts](<apps/web/src/routes/(authenticated)/workspaces/data.remote.ts>) as the reference.
- Authenticated pages live under the `(authenticated)` route group; the group layout enforces the redirect-to-login guard.
- Lint with ESLint (`pnpm --filter web lint`); format with Prettier (`pnpm format` from the root).
  Nothing lints during `vite dev` any more — run the scripts or rely on the editor.
- `svelte-eslint-parser` needs the Svelte compiler options, but this app passes them inline to
  `sveltekit()` in `vite.config.ts` rather than using a `svelte.config.js`. They are mirrored in
  [apps/web/eslint.config.js](apps/web/eslint.config.js) — change both together.
- `svelte/no-navigation-without-resolve` is set to **warn**: existing links don't use `resolve()`
  from `$app/paths` yet. Prefer `resolve()` in new markup.
- Prefer `@bridgeops/api` types over hand-written response interfaces.

## Database Guardrails

- Import Prisma client from `@bridgeops/database`; avoid creating app-local Prisma clients.
  The shared client uses the `@prisma/adapter-pg` driver adapter and Varlock-loaded `DATABASE_URL`.
- For schema updates:
  1. Modify [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)
  2. `pnpm --filter @bridgeops/database migrate`
  3. `pnpm --filter @bridgeops/database generate`
- Keep migrations in [packages/database/prisma/migrations](packages/database/prisma/migrations). Never edit an applied migration; add a new one.
- The datasource URL comes from [packages/database/prisma.config.ts](packages/database/prisma.config.ts), not from `schema.prisma`.
- Multi-tenancy: every tenant-scoped model hangs off `Workspace`, and access is granted through `Membership`
  (`OWNER | ADMIN | DEVELOPER | VIEWER`). `User.activeWorkspaceId` tracks the currently selected workspace.
  New tenant-scoped queries must filter by workspace membership, not just by workspace id.

## Background Jobs

- Producer: the API's `/api/v1/jobs` route adds to a BullMQ `Queue` named `QUEUE_NAME` on `QUEUE_URL`.
- Consumer: [apps/worker/src/index.ts](apps/worker/src/index.ts) runs a BullMQ `Worker` with graceful SIGINT/SIGTERM shutdown.
- Both sides need Redis running and the same `QUEUE_NAME` / `QUEUE_URL` (defined once in the root `.env.schema`).
- `QUEUE_NAME` and `QUEUE_URL` are listed in `start.passThroughEnv` in [turbo.json](turbo.json); keep that in sync.

## UI and Styling Guardrails

- Follow the repo design system reference: [.agents/skills/DESIGN.md](.agents/skills/DESIGN.md)
- Design tokens are already declared as CSS custom properties in [apps/web/src/routes/layout.css](apps/web/src/routes/layout.css) — use them rather than raw hex values.
- The app is dark-theme only (Void Black canvas, hairline borders, a single periwinkle accent). Preserve the established visual language unless explicitly asked to redesign.
- Fonts are self-hosted via `@fontsource/inter` and `@fontsource/inter-tight`; do not add external font links.

## Agent Working Conventions

- Prefer minimal, targeted changes; do not refactor unrelated files.
- Run checks closest to your change scope first, then broader checks if needed.
- For web changes:
  1. `pnpm --filter web check`
  2. `pnpm --filter web lint`
  3. `pnpm --filter web build` (when behavior or routing changed)
- For API changes:
  1. `pnpm --filter @bridgeops/api build` (this is the typecheck)
  2. `pnpm exec vitest run --project api`
  3. `pnpm --filter tests integration` when routing, middleware, or error handling changed
- For schema changes: migrate, generate, then rebuild anything that imports `@bridgeops/database`.
- Branch names follow the Linear convention (`bri-<id>-<slug>`); commits use Conventional Commits, often with the ticket id: `feat(BRI-188): ...`.
- There is no CI workflow in `.github/workflows` yet — local checks are the only gate.

## Known Rough Edges

- `pnpm test` and `pnpm lint` cover far less than their names suggest (see Turbo task coverage above).
- [apps/api/src/index.ts](apps/api/src/index.ts) calls `createV1()` twice; the first `api` const exists only to derive `BridgeOpsAPI`.
- `AppEnv["Variables"]` does not yet declare `workspaceId` / `workspaceMembership` / `workspaceRole`, though
  `workspaceAuthorisation` sets them. Extend `AppEnv` when you start consuming them.
- The `AsyncLocalStorage` context in [apps/api/src/app.ts](apps/api/src/app.ts) is exported but its middleware is commented out.
- `app.onError` is registered twice in `createApp` (`handle`, then `handleError`); the later registration wins.

## Helpful Documentation

- Root README: [README.md](README.md)
- Web README: [apps/web/README.md](apps/web/README.md)
- API README: [apps/api/README.md](apps/api/README.md)

## Svelte MCP Server

You have access to the Svelte MCP server with comprehensive Svelte 5 and SvelteKit documentation.

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
