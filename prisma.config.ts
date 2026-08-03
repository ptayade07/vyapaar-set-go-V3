import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "backend/prisma/schema.prisma",
  migrations: {
    seed: "tsx backend/prisma/seed.ts",
  },
});
