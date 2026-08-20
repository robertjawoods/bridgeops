import pino from 'pino'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../../api/src/app.js'
import { createJobs, type JobQueue } from '../../api/src/v1/jobs/index.js'

const createTestApp = () =>
	createApp({
		rootLogger: pino({ level: 'silent' }),
	}).app

describe('API integration', () => {
	it('returns the service greeting from the root endpoint', async () => {
		const response = await createTestApp().request('/')

		expect(response.status).toBe(200)
		expect(await response.text()).toBe('Hello BridgeOps!')
	})

	it('reports the service as alive', async () => {
		const response = await createTestApp().request('/healthz')

		expect(response.status).toBe(200)
		expect(await response.text()).toBe('alive')
	})

	it('rejects unauthenticated API requests', async () => {
		const response = await createTestApp().request('/api/v1/workspaces')

		expect(response.status).toBe(401)
		expect(await response.json()).toMatchObject({
			error: {
				code: 'UNAUTHENTICATED',
			},
		})
	})

	it.todo('reports the service as ready when the database is reachable', async () => {
		const response = await createTestApp().request('/ready')

		expect(response.status).toBe(200)
		expect(await response.text()).toBe('ready')
	})

	it('publishes a job through the injected queue', async () => {
		const queue = {
			add: vi.fn().mockResolvedValue({ id: 'job-1', name: 'deploy' }),
		} as unknown as JobQueue


		const response = await createJobs({ queue }).request('/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'deploy', data: { service: 'api' } }),
		})

		expect(response.status).toBe(202)
		expect(await response.json()).toEqual({ id: 'job-1', name: 'deploy' })
		expect(queue.add).toHaveBeenCalledWith('deploy', { service: 'api' })
	})
})
