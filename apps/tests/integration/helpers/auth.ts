import { createServer, type Server } from "node:http";
import { type JWK, SignJWT, exportJWK, generateKeyPair } from "jose";

/**
 * `requireAuth` verifies tokens against a remote JWKS endpoint
 * (`${APP_INTERNAL_URL}/api/auth/jwks`, served in production by Better Auth in the web
 * app). Rather than mocking the middleware — which would leave auth untested — we stand
 * up a real JWKS endpoint on an ephemeral port and mint genuinely signed tokens, so the
 * full `jose` verification path (signature, issuer, audience, expiry) runs for real.
 */

const ALG = "EdDSA";

export type JwksServer = {
	/** Origin the app should treat as both APP_URL and APP_INTERNAL_URL. */
	origin: string;
	/** Mint a token the server's published key set will validate. */
	signToken: (options?: SignTokenOptions) => Promise<string>;
	/** Mint a well-formed token signed by a key the server does NOT publish. */
	signWithForeignKey: (options?: SignTokenOptions) => Promise<string>;
	close: () => Promise<void>;
};

export type SignTokenOptions = {
	subject?: string;
	issuer?: string;
	audience?: string;
	/** jose duration string ("5m") or epoch seconds. Past values produce an expired token. */
	expiresAt?: string | number;
};

export const startJwksServer = async (): Promise<JwksServer> => {
	const { publicKey, privateKey } = await generateKeyPair(ALG);
	const foreign = await generateKeyPair(ALG);

	const publicJwk: JWK = { ...(await exportJWK(publicKey)), alg: ALG, use: "sig", kid: "test-key" };

	const server: Server = createServer((req, res) => {
		if (req.url === "/api/auth/jwks") {
			res.writeHead(200, { "content-type": "application/json" });
			res.end(JSON.stringify({ keys: [publicJwk] }));
			return;
		}

		res.writeHead(404).end();
	});

	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

	const address = server.address();

	if (address === null || typeof address === "string") {
		throw new Error("JWKS test server did not bind to a TCP port");
	}

	const origin = `http://127.0.0.1:${address.port}`;

	const sign = async (key: CryptoKey, options: SignTokenOptions = {}) => {
		const {
			subject = "test-user",
			issuer = origin,
			audience = origin,
			expiresAt = "5m",
		} = options;

		return new SignJWT({})
			.setProtectedHeader({ alg: ALG, kid: "test-key" })
			.setSubject(subject)
			.setIssuer(issuer)
			.setAudience(audience)
			.setIssuedAt()
			.setExpirationTime(expiresAt)
			.sign(key);
	};

	return {
		origin,
		signToken: (options) => sign(privateKey as CryptoKey, options),
		signWithForeignKey: (options) => sign(foreign.privateKey as CryptoKey, options),
		close: () => new Promise<void>((resolve) => server.close(() => resolve())),
	};
};

/** Set by the per-file setup so suites can mint tokens without re-plumbing the server. */
let activeServer: JwksServer | undefined;

export const setActiveJwksServer = (server: JwksServer | undefined) => {
	activeServer = server;
};

export const jwks = (): JwksServer => {
	if (!activeServer) {
		throw new Error("JWKS test server is not running — is setup.ts registered as a setupFile?");
	}

	return activeServer;
};

/** Convenience: a valid bearer token for `subject`. */
export const bearer = async (subject: string, options: SignTokenOptions = {}) =>
	`Bearer ${await jwks().signToken({ subject, ...options })}`;
