/** @type {import('next').NextConfig} */
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
        NEXT_PUBLIC_BASE_PATH: "/slack-app-shell-template-prototype",
    },
    images: {
        unoptimized: true, // Required for static export
        remotePatterns: [
            { protocol: "https", hostname: "randomuser.me", pathname: "/**" },
            { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
        ],
    },
    // Configure for GitSoma Pages deployment
    basePath: '/slack-app-shell-template-prototype',
    assetPrefix: '/slack-app-shell-template-prototype',
};

export default nextConfig;
