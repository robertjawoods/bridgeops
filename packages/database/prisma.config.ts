import { defineConfig } from "prisma/config";
import "varlock/auto-load";
import { ENV } from "varlock/env";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: ENV.DATABASE_URL,
	},
});
