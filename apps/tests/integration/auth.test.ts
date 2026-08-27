import { describe, expect, it } from "vitest";
import { jwks } from "./helpers/auth.js";
import { buildTestApp, request } from "./helpers/app.js";
import { createUserWithWorkspace } from "./helpers/factories.js";

/**
 * `requireAuth` guards everything under `/api/*`. These cases run against the real
 * middleware and a real JWKS endpoint, so signature, issuer, audience and expiry
 * checks are genuinely exercised rather than mocked away.
 */
describe("requireAuth", () => {
	const protectedPath = "/api/v1/workspaces";

	describe("rejects", () => {
		it("a request with no Authorization header", async () => {
			const response = await request(buildTestApp(), protectedPath);

			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({
				error: "Missing or invalid Authorization header",
			});
		});

		it.each([
			["a non-Bearer scheme", "Basic dXNlcjpwYXNz"],
			["a bare token with no scheme", "some-token"],
			["a lowercase bearer scheme", "bearer some-token"],
			["an empty header", ""],
		])("%s", async (_label, authorization) => {
			const response = await request(buildTestApp(), protectedPath, {
				authorization,
			});

			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({
				error: "Missing or invalid Authorization header",
			});
		});

		it("a structurally invalid token", async () => {
			const response = await request(buildTestApp(), protectedPath, {
				authorization: "Bearer not-a-jwt",
			});

			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({ error: "Unauthorized" });
		});

		it("an expired token", async () => {
			const token = await jwks().signToken({
				expiresAt: Math.floor(Date.now() / 1000) - 60,
			});

			const response = await request(buildTestApp(), protectedPath, {
				authorization: `Bearer ${token}`,
			});

			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({ error: "Unauthorized" });
		});

		it("a token with the wrong issuer", async () => {
			const token = await jwks().signToken({ issuer: "https://evil.example" });

			const response = await request(buildTestApp(), protectedPath, {
				authorization: `Bearer ${token}`,
			});

			expect(response.status).toBe(401);
		});

		it("a token with the wrong audience", async () => {
			const token = await jwks().signToken({
				audience: "https://evil.example",
			});

			const response = await request(buildTestApp(), protectedPath, {
				authorization: `Bearer ${token}`,
			});

			expect(response.status).toBe(401);
		});

		it("a well-formed token signed by an unpublished key", async () => {
			const token = await jwks().signWithForeignKey();

			const response = await request(buildTestApp(), protectedPath, {
				authorization: `Bearer ${token}`,
			});

			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({ error: "Unauthorized" });
		});

		it("without leaking the underlying verification failure", async () => {
			const response = await request(buildTestApp(), protectedPath, {
				authorization: "Bearer not-a-jwt",
			});

			const body = JSON.stringify(await response.json());

			expect(body).not.toMatch(/jwks|signature|jose|JWSInvalid/i);
		});
	});

	describe("accepts", () => {
		it("a valid token", async () => {
			const user = await createUserWithWorkspace();

			const response = await request(buildTestApp(), protectedPath, {
				as: user.user.id,
			});

			expect(response.status).toBe(200);
		});

		it("and resolves userId from the token subject", async () => {
			// Two users with distinct workspaces: the response is only correct if the
			// middleware put *this* token's `sub` into the request context.
			const alice = await createUserWithWorkspace({ slug: "alice-workspace" });
			const bob = await createUserWithWorkspace({ slug: "bob-workspace" });

			const response = await request(buildTestApp(), protectedPath, {
				as: alice.user.id,
			});
			const body = (await response.json()) as {
				workspaces: { slug: string }[];
			};

			expect(body.workspaces.map((workspace) => workspace.slug)).toEqual([
				"alice-workspace",
			]);
			expect(bob.workspace.slug).toBe("bob-workspace");
		});
	});
});
