import { describe, expect, it } from "vitest";
import { buildTestApp, request } from "./helpers/app.js";

describe("health endpoints", () => {
	it("returns the service greeting from the root endpoint", async () => {
		const response = await request(buildTestApp(), "/");

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("Hello BridgeOps!");
	});

	it("reports the service as alive", async () => {
		const response = await request(buildTestApp(), "/healthz");

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("alive");
	});

	it("reports the service as ready when the database is reachable", async () => {
		const response = await request(buildTestApp(), "/ready");

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("ready");
	});

	it("does not require authentication for health endpoints", async () => {
		for (const path of ["/", "/healthz", "/ready"]) {
			expect((await request(buildTestApp(), path)).status).toBe(200);
		}
	});

	it("returns 404 for an unknown path", async () => {
		const response = await request(buildTestApp(), "/does-not-exist");

		expect(response.status).toBe(404);
	});
});
