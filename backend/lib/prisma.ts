import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    transactionOptions: {
      // Neon's connection latency regularly exceeds Prisma's 2s/5s defaults, which surfaces as
      // "Unable to start a transaction in the given time" on otherwise-fine short transactions.
      maxWait: 10000,
      timeout: 15000,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
