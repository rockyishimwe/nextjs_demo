import type { Metadata } from "next";
import { Schibsted_Grotesk, Martian_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { Toaster } from "sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

import ConditionalLightRays from "@/app/_components/ConditionalLightRays";
import Navbar from "@/components/Navbar";
import { PostHogProvider } from "./providers";
import PostHogPageView from "./_components/PostHogPageView";
import { ClerkProvider } from "@clerk/nextjs";

const schibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted-grotesk",
  subsets: ["latin"],
});

const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body
        className={`${schibstedGrotesk.variable} ${martianMono.variable} min-h-screen antialiased`}
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
