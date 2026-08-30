import type { NextConfig } from "next";
import path from "node:path";

// Explicitly pins the Turbopack workspace root to this project directory.
// Without this, Turbopack's automatic root inference can land on the
// wrong directory (e.g. app/) on some machines — usually because it finds
// a lockfile-like marker in a parent folder above the project and assumes
// that's the monorepo root — which then fails with "Next.js inferred your
// workspace root, but it may not be correct... We couldn't find the
// Next.js package (next/package.json)". Setting this removes the
// guesswork entirely. See rebuild-plan.md Step 20.
const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
