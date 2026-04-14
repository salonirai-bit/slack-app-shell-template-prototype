import type { Metadata } from "next";
import { Lato } from "next/font/google";
// import { NuqsAdapter } from "nuqs/adapters/next"; // Disabled for static export
import { Suspense } from "react";

import "./globals.css";

import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
// import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server"; // Disabled for static export
import Modals from "@/components/modals";
import { Toaster } from "@/components/ui/sonner";
import JotaiProvider from "@/components/providers/JotaiProvider";
import { DemoDataProvider } from "@/context/DemoDataContext";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Slack Vision — Partner Cloud",
  description: "Slack Vision Partner Cloud prototype: channel manager and partner experiences in a Slack-style shell.",
  icons: {
    icon: `${basePath}/slackbot-logo.svg`,
  },
};

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const hasConvex = !!convexUrl && !convexUrl.includes("demo-disabled");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <ConvexClientProvider>
      <JotaiProvider>
        <DemoDataProvider>
          <Suspense fallback={null}>
            <Toaster />
            {hasConvex && <Modals />}
            {children}
            {/* <NuqsAdapter>{children}</NuqsAdapter> */}
          </Suspense>
        </DemoDataProvider>
      </JotaiProvider>
    </ConvexClientProvider>
  );

  return (
    <html lang="en">
      <body className={lato.className}>
        {content}
        {/* {hasConvex ? (
          <ConvexAuthNextjsServerProvider>{content}</ConvexAuthNextjsServerProvider>
        ) : (
          content
        )} */}
      </body>
    </html>
  );
}
