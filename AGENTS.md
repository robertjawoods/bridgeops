# BridgeOps Agent Guide

This file helps AI coding agents become productive quickly in this monorepo.

## Scope

- Monorepo manager: pnpm workspace + Turbo.
- App surfaces:
  - `apps/web`: SvelteKit frontend, Better Auth integration.
  - `apps/api`: Hono API scaffold.
  - `packages/database`: Prisma schema, client, migrations.

## Fast Start Commands

- Install deps: `pnpm install`
- Full dev stack: `pnpm dev`
- Build all: `pnpm build`
- Lint all: `pnpm lint`
- Test all: `pnpm test`
- Format all: `pnpm format`

Package-specific commands:
- Web typecheck: `pnpm --filter web check`
- Web lint: `pnpm --filter web lint`
- API dev: `pnpm --filter api dev`
- Prisma generate: `pnpm --filter @bridgeops/database generate`
- Prisma migrate: `pnpm --filter @bridgeops/database migrate`

## Key File Map

- Auth setup: [apps/web/src/lib/auth.ts](apps/web/src/lib/auth.ts)
- Auth request handling: [apps/web/src/hooks.server.ts](apps/web/src/hooks.server.ts)
- Root session/user propagation: [apps/web/src/routes/+layout.server.ts](apps/web/src/routes/+layout.server.ts)
- Web build/runtime config: [apps/web/vite.config.ts](apps/web/vite.config.ts)
- DB package entry: [packages/database/src/index.ts](packages/database/src/index.ts)
- Prisma config: [packages/database/prisma.config.ts](packages/database/prisma.config.ts)
- Prisma schema: [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)
- Railway tunnel script: [scripts/railway-prisma-tunnel.sh](scripts/railway-prisma-tunnel.sh)

## Environment + Secrets Rules

- Use Varlock workflows for env handling. Do not print or commit raw secrets.
- Treat `.env.schema` files as source-of-truth for env contracts:
  - [/.env.schema](.env.schema)
  - [apps/web/.env.schema](apps/web/.env.schema)
  - [packages/database/.env.schema](packages/database/.env.schema)
- Avoid editing tracked `.env` files unless the task explicitly requires it.

## Auth Guardrails

- Better Auth is wired through SvelteKit hooks. Keep `svelteKitHandler(...)` as the request integration point.
- Preserve origin normalization behavior in auth config to avoid route mismatch due to trailing slashes.
- When changing auth flow, validate:
  - login/signup form actions
  - session propagation from `locals` via layout server load
  - callback/origin behavior for localhost and ngrok host

## Database Guardrails

- Import Prisma client from `@bridgeops/database`; avoid creating app-local Prisma clients.
- For schema updates:
  1. Modify [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)
  2. Run migration in database package
  3. Regenerate Prisma client
- Keep migrations in [packages/database/prisma/migrations](packages/database/prisma/migrations).

## UI and Styling Guardrails

- Follow the repo design system reference: [.agents/skills/DESIGN.md](.agents/skills/DESIGN.md)
- Preserve established visual language unless explicitly asked to redesign.

## Agent Working Conventions

- Prefer minimal, targeted changes; do not refactor unrelated files.
- Run checks closest to your change scope first, then broader checks if needed.
- For web changes, prefer this sequence:
  1. `pnpm --filter web check`
  2. `pnpm --filter web lint`
  3. `pnpm --filter web build` (when behavior or routing changed)

## Helpful Documentation

- Web README: [apps/web/README.md](apps/web/README.md)
- API README: [apps/api/README.md](apps/api/README.md)

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

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
