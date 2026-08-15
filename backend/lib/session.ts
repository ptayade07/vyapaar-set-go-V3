import { jwtVerify, SignJWT } from "jose";

// No Prisma import in this file on purpose -- it has to run inside proxy.ts's Edge runtime, same
// constraint that shaped backend/lib/shop-context.ts in Stage 1. jose's JWT verification is pure
// crypto, no DB call, so it's Edge-safe.

const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET env var is not set. Add it to .env (see README).");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  shopId: string;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string" || typeof payload.shopId !== "string") {
      return null;
    }
    return { userId: payload.userId, shopId: payload.shopId };
  } catch {
    // Expired, tampered, or malformed -- all treated the same as "no session."
    return null;
  }
}
