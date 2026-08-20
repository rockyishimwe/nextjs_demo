import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { Toaster } from "sonner";

import ConditionalLightRays from "@/app/_components/ConditionalLightRays";
import Navbar from "@/components/Navbar";
import { PostHogProvider } from "./providers";
import PostHogPageView from "./_components/PostHogPageView";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "DevEvent",
  description: "The Hub for Every Dev Event You Mustn't Miss",
  openGraph: {
    title: "DevEvent",
    description: "The Hub for Every Dev Event You Mustn't Miss",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans")}>
      <body
        className={`${cn(
          "font-schibsted-grotesk",
          "font-martian-mono"
        )} min-h-screen antialiased`}
      >
        <ClerkProvider>
          <PostHogProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <Navbar />
            <Toaster position="top-right" richColors />

            <ConditionalLightRays />

            <main>{children}</main>
          </PostHogProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
