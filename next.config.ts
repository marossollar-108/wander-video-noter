import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingExcludes: {
    "*": [
      "uploads/**",
      "data/**",
      "build/**",
      "release/**",
      "python/**",
      ".venv/**",
      "public/notes/**",
      "scripts/**",
      "electron/**",
      "*.png",
      "*.jpg",
      "*.jpeg",
      "*.md",
      "*.jsx",
      "wander-video-noter.jsx",
      "video_notes.py",
      "tsconfig.tsbuildinfo",
    ],
  },
  turbopack: {
    root: path.join(__dirname),
  },
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  // App routes were retired — keep only the landing page on "/".
  // Old links (dashboard/new/library/queue/settings/galeria/notes) redirect home.
  async redirects() {
    const retired = ["dashboard", "new", "library", "queue", "settings", "galeria", "notes"];
    return retired.flatMap((p) => [
      { source: `/${p}`, destination: "/", permanent: false },
      { source: `/${p}/:path*`, destination: "/", permanent: false },
    ]);
  },
};

export default nextConfig;
