# BridgeOps

BridgeOps is an operations platform for monitoring systems, collecting telemetry, managing incidents, and coordinating operational response.

It is currently an MVP under active development.

## Tech Stack

- **Web:** SvelteKit, Svelte 5, Tailwind CSS
- **API:** Hono, Node.js, TypeScript
- **Worker:** Node.js, BullMQ, Redis
- **Database:** PostgreSQL, Prisma
- **Authentication:** Better Auth
- **Monorepo:** pnpm, Turborepo
- **Testing:** Vitest

## Project Structure

```text
bridgeops/
├── apps/
│   ├── api/          # Hono API
│   ├── web/          # SvelteKit application
│   └── worker/       # Background jobs
│
├── packages/
│   └── database/     # Shared Prisma database package
│
├── docker/           # Local infrastructure
└── scripts/          # Project scripts
```

## Getting Started

### Prerequisites

- Node.js
- pnpm 11
- PostgreSQL
- Redis

### Installation

```bash
git clone https://github.com/robertjawoods/bridgeops.git
cd bridgeops
pnpm install
```

Configure the required environment variables using `.env.schema`.

Start the development environment:

```bash
pnpm dev
```

## Common Commands

```bash
pnpm dev       # Start development
pnpm build     # Build all applications and packages
pnpm test      # Run tests
pnpm lint      # Run linting
pnpm format    # Format the codebase
pnpm start     # Start built applications
```

### Database

```bash
pnpm generate                              # Generate Prisma client
pnpm --filter @bridgeops/database migrate  # Run migrations
pnpm --filter @bridgeops/database studio   # Open Prisma Studio
pnpm --filter @bridgeops/database seed     # Seed the database
```

## Current Scope

BridgeOps is intended to bring together:

- **Monitoring & telemetry** — collecting and observing system health and operational data
- **Incident management** — tracking incidents from detection through resolution
- **Service management** — managing the services and systems being monitored
- **Integrations** — connecting external systems and services
- **Notifications** — alerting teams when action is required
- **Background processing** — handling asynchronous and scheduled operations
- **Authentication & workspaces** — managing users, organisations, and access
- **Audit logging** — maintaining a record of operational activity

The platform is designed to provide a single place for teams to understand the health of their systems and respond when things go wrong.

## Development

BridgeOps is actively being developed, so the API, database schema, and application functionality are subject to change.

The project is not currently intended for production use.
