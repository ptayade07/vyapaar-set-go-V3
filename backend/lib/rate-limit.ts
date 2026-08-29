import { createHash } from "node:crypto";
import { headers } from "next/headers";

// A hash of the caller's IP, not the raw address -- rate-limit tables don't become a second place
// raw IPs are stored. Falls back to a constant bucket when there's no proxy in front of the
// request (e.g. local dev without x-forwarded-for) -- rate limiting degrades to "one shared bucket
// for all local requests" there, which only matters for local testing, not production on Vercel.
export async function getCallerIpHash(): Promise<string> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

// Structural type, not a specific Prisma model -- lets signupAction, loginAction, and
// requestPasswordResetAction each pass their own dedicated attempt table (SignupAttempt,
// LoginAttempt, PasswordResetAttempt) through the same counting/recording logic, rather than
// sharing one table across unrelated actions or duplicating this logic three times.
type AttemptDelegate = {
  count(args: { where: { ipHash: string; createdAt: { gte: Date } } }): Promise<number>;
  create(args: { data: { ipHash: string } }): Promise<unknown>;
};

/** Pilot-scale rate limiting, not real abuse infrastructure -- see PRODUCTION_STAGES.md. */
export async function isWithinRateLimit(delegate: AttemptDelegate, ipHash: string, limit: number, windowMs: number) {
  const windowStart = new Date(Date.now() - windowMs);
  const count = await delegate.count({ where: { ipHash, createdAt: { gte: windowStart } } });
  return count < limit;
}

export async function recordAttempt(delegate: AttemptDelegate, ipHash: string) {
  await delegate.create({ data: { ipHash } });
}
