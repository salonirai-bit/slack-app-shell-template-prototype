/** @type {import('next').NextConfig} */
// GitHub Pages needs basePath; `output: 'export'` + basePath breaks `next dev` routing (404 on all pages).
const publishBasePath = "/slack-app-shell-template-prototype";
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
    // Enable static export for GitHub Pages (GitSoma)
    // Comment out 'output: export' if deploying to Vercel/Netlify
    output: 'export',
    
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
    // Production / `next build`: GitSoma Pages. Local dev: serve at /
    ...(isDev
        ? {}
        : {
              basePath: publishBasePath,
              assetPrefix: publishBasePath,
          }),
};

export default nextConfig;
