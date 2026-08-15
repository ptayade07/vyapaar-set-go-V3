import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The entire "shops created by hand" mechanism for Stage 2 (PRODUCTION_STAGES.md) -- a script, not
// an admin UI, on purpose: we don't yet know what an admin screen actually needs to do, so we're
// not building one until real pilot usage tells us (see the "two dashboards" discussion in that
// file). Run this once per pilot shopkeeper, and once for any existing shop that needs a login
// retrofitted onto it.
//
// Usage: npx tsx backend/prisma/create-pilot-user.ts "Shop Name" owner@example.com "a password"
//    or: npx tsx backend/prisma/create-pilot-user.ts --existing-shop <shopId> owner@example.com "a password"

const SALT_ROUNDS = 12;

async function main() {
  const args = process.argv.slice(2);

  let shopId: string | null = null;
  let shopName: string | null = null;
  let email: string;
  let password: string;

  if (args[0] === "--existing-shop") {
    shopId = args[1];
    email = args[2];
    password = args[3];
  } else {
    shopName = args[0];
    email = args[1];
    password = args[2];
  }

  if (!email || !password || (!shopId && !shopName)) {
    console.error(
      'Usage: npx tsx backend/prisma/create-pilot-user.ts "Shop Name" owner@example.com "a password"\n' +
        "   or: npx tsx backend/prisma/create-pilot-user.ts --existing-shop <shopId> owner@example.com \"a password\"",
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    console.error(`A user with email ${normalizedEmail} already exists (id: ${existingUser.id}).`);
    process.exit(1);
  }

  const passwordHash = await hash(password, SALT_ROUNDS);

  const shop = shopId
    ? await prisma.shop.findUniqueOrThrow({ where: { id: shopId } })
    : await prisma.shop.create({ data: { name: shopName! } });

  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash, shopId: shop.id },
  });

  console.log(`Created login for shop "${shop.name}" (${shop.id}):`);
  console.log(`  email: ${user.email}`);
  console.log(`  user id: ${user.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
