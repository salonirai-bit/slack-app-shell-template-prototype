/** @type {import('next').NextConfig} */
// `npm run dev` → no static export, no basePath (App Router works at /).
// `npm run build` sets NEXT_USE_PAGES_BASE=1 → output: export + basePath for GitHub Pages.
const pagesBasePath = "/slack-app-shell-template-prototype";
const usePagesBase = process.env.NEXT_USE_PAGES_BASE === "1";

const nextConfig = {
  ...(usePagesBase ? { output: "export" } : {}),

  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || "https://demo-disabled.convex.cloud",
    NEXT_PUBLIC_BASE_PATH: usePagesBase ? pagesBasePath : "",
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "randomuser.me", pathname: "/**" },
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
    ],
  },
  ...(usePagesBase ? { basePath: pagesBasePath, assetPrefix: pagesBasePath } : {}),
};

export default nextConfig;
