/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: false,
  // Don't auto-generate/regenerate AGENTS.md and CLAUDE.md on `next dev`.
  agentRules: false,
};

export default config;
