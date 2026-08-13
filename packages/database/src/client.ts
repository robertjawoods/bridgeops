import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "varlock/auto-load";
import { ENV } from "varlock/env";

const adapter = new PrismaPg({ connectionString: ENV.DATABASE_URL });
const prisma = new PrismaClient({
    adapter,
    log: [
        { emit: "event", level: "info" }
    ]
});

prisma.$on("info", (e) => {
    console.log(e);
})

export { prisma }