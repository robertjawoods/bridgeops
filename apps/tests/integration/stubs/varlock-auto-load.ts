/**
 * Test stub for `varlock/auto-load`.
 *
 * The real module resolves `.env.schema` files (and reaches out to Infisical) at import
 * time and throws if it cannot initialise. Tests supply configuration through
 * `process.env` and the `varlock/env` stub instead, so this is intentionally a no-op.
 */
export {};
