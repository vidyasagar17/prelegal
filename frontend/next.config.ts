import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app so a stray lockfile elsewhere on the
  // machine isn't inferred as the root.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
