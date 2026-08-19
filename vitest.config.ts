import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: 'api',
                    include: ['apps/api/**/*.test.ts'],
                    environment: 'node',
                },
            },
            {
                extends: true,
                test: {
                    name: 'packages',
                    include: ['packages/**/*.test.ts'],
                    environment: 'node',
                },
            },
            {
                extends: true,
                test: {
                    name: 'integration',
                    include: ['apps/tests/integration/**/*.ts'],
                    environment: 'node',
                },
            },
        ],
    },
})