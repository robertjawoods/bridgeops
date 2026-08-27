import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "varlock/auto-load";
import { ENV } from "varlock/env";

export type { MembershipRole, Workspace } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: ENV.DATABASE_URL });
const prisma = new PrismaClient({
    adapter,
    log: [
        { emit: "event", level: "info" },
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" }
    ]
});

prisma.$on("info", (e) => {
    console.log(e);
})
prisma.$on("warn", (e) => {
    console.warn(e);
})
prisma.$on("error", (e) => {
    console.error(e);
})

export { prisma }