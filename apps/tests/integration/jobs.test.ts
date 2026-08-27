import { describe, expect, it } from "vitest";
import { buildTestApp, fakeQueue, request } from "./helpers/app.js";
import { createUser } from "./helpers/factories.js";

describe("POST /api/v1/jobs", () => {
	it("publishes a job through the injected queue", async () => {
		const user = await createUser();
		const queue = fakeQueue({ id: "job-1", name: "deploy" });

		const response = await request(buildTestApp({ queue }), "/api/v1/jobs", {
			method: "POST",
			as: user.id,
			json: { name: "deploy", data: { service: "api" } },
		});

		expect(response.status).toBe(202);
		expect(await response.json()).toEqual({ id: "job-1", name: "deploy" });
		expect(queue.add).toHaveBeenCalledWith("deploy", { service: "api" });
	});

	it("defaults an omitted payload to an empty object", async () => {
		const user = await createUser();
		const queue = fakeQueue({ id: "job-2", name: "deploy" });

		await request(buildTestApp({ queue }), "/api/v1/jobs", {
			method: "POST",
			as: user.id,
			json: { name: "deploy" },
		});

		expect(queue.add).toHaveBeenCalledWith("deploy", {});
	});

	it("returns 500 when the queue returns a job without an id", async () => {
		const user = await createUser();
		const queue = fakeQueue({ name: "deploy" });

		const response = await request(buildTestApp({ queue }), "/api/v1/jobs", {
			method: "POST",
			as: user.id,
			json: { name: "deploy" },
		});

		expect(response.status).toBe(500);
		// `handleError` echoes an AppError's message whatever its code, so the
		// developer-authored INTERNAL_ERROR text is surfaced to the client here.
		// Only non-AppError throwables are masked as "Internal server error".
		expect(await response.json()).toEqual({
			error: "Job was created without an ID",
		});
	});

	it("requires authentication", async () => {
		const queue = fakeQueue();

		const response = await request(buildTestApp({ queue }), "/api/v1/jobs", {
			method: "POST",
			json: { name: "deploy" },
		});

		expect(response.status).toBe(401);
		expect(queue.add).not.toHaveBeenCalled();
	});

	describe("validation", () => {
		it.each([
			["a missing name", {}],
			["an empty name", { name: "" }],
			["a name over 100 characters", { name: "a".repeat(101) }],
		])("rejects %s without enqueuing", async (_label, json) => {
			const user = await createUser();
			const queue = fakeQueue();

			const response = await request(buildTestApp({ queue }), "/api/v1/jobs", {
				method: "POST",
				as: user.id,
				json,
			});

			expect(response.status).toBe(400);
			expect(queue.add).not.toHaveBeenCalled();
		});
	});
});
