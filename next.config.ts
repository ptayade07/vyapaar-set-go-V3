import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // playwright.config.ts drives the app against 127.0.0.1, which Next's dev server otherwise
  // treats as a cross-origin request and blocks HMR/asset loading for (breaks hydration in e2e).
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
