/** @type {import('next').NextConfig} */
// GitHub Pages needs a subpath. Dev server must stay at `/` (basePath breaks `next dev`).
//
// • Default `npm run build`: assets use `/slack-app-shell-template-prototype/...`
//   (must match the GitHub repo name for username.github.io/<repo>/ Pages).
//   → `next start`: open http://localhost:3000/slack-app-shell-template-prototype
// • Local static preview at site root: `npm run build:local` then `npm run preview:local`
//   (sets BASE_PATH= so links are `/ _next/...`).
const isDev = process.env.NODE_ENV === "development";
const publishBasePath =
  process.env.BASE_PATH !== undefined
    ? String(process.env.BASE_PATH).trim() || ""
    : "/slack-app-shell-template-prototype";

const nextConfig = {
    // Static export only for production `next build` (GitHub Pages / `out`).
    // Keeping it off during `next dev` avoids dev-server 404s and routing bugs with App Router + export.
    ...(isDev ? {} : { output: "export" }),
    
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Demo mode: use placeholder when Convex not configured (Convex auth requires var to be set)
    env: {
        NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || "https://demo-disabled.convex.cloud",
        NEXT_PUBLIC_BASE_PATH: isDev ? "" : publishBasePath,
    },
    images: {
        unoptimized: true, // Required for static export
        remotePatterns: [
            { protocol: "https", hostname: "randomuser.me", pathname: "/**" },
            { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
        ],
    },
    // Production / `next build`: optional subpath (empty BASE_PATH = site root).
    ...(isDev || !publishBasePath
        ? {}
        : {
              basePath: publishBasePath,
              assetPrefix: publishBasePath,
          }),
};

export default nextConfig;
