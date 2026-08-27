import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const resolveFromRoot = (relativePath: string) =>
    fileURLToPath(new URL(relativePath, import.meta.url))

/**
 * `varlock/env` resolves configuration from `.env.schema` files and Infisical and
 * ignores `process.env` entirely, so tests cannot point the app at a throwaway
 * database or a local JWKS server. Both projects alias it to a stub backed by
 * `process.env`. `varlock/auto-load` is stubbed to a no-op for the same reason.
 */
const varlockAliases = [
    { find: 'varlock/auto-load', replacement: resolveFromRoot('./apps/tests/integration/stubs/varlock-auto-load.ts') },
    { find: 'varlock/env', replacement: resolveFromRoot('./apps/tests/integration/stubs/varlock-env.ts') },
]

const sharedExclude = ['**/node_modules/**', '**/dist/**', '**/.svelte-kit/**']

export default defineConfig({
    test: {
        projects: [
            {
                resolve: { alias: varlockAliases },
                test: {
                    name: 'api',
                    include: ['apps/api/**/*.test.ts'],
                    exclude: sharedExclude,
                    environment: 'node',
                    server: { deps: { inline: [/@bridgeops\//] } },
                },
            },
            {
                resolve: { alias: varlockAliases },
                test: {
                    name: 'packages',
                    include: ['packages/**/*.test.ts'],
                    exclude: [...sharedExclude, '**/generated/**'],
                    environment: 'node',
                    server: { deps: { inline: [/@bridgeops\//] } },
                },
            },
            {
                resolve: { alias: varlockAliases },
                test: {
                    name: 'integration',
                    // Only *.test.ts — helpers/ and stubs/ live alongside the suites and
                    // would otherwise be collected as (empty) test files.
                    include: ['apps/tests/integration/**/*.test.ts'],
                    exclude: sharedExclude,
                    environment: 'node',
                    globalSetup: ['apps/tests/integration/globalSetup.ts'],
                    setupFiles: ['apps/tests/integration/setup.ts'],
                    // One shared Postgres container for the run, so suites must not
                    // interleave their truncate/seed cycles.
                    fileParallelism: false,
                    testTimeout: 30_000,
                    hookTimeout: 120_000,
                    server: { deps: { inline: [/@bridgeops\//] } },
                },
            },
        ],
    },
})
