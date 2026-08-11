import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Studio — AI Agent Development Dashboard",
  description:
    "A modern AI command center where multiple AI agents collaborate to research, design, code, test, and deploy complete websites.",
  keywords: ["AI agents", "UI research", "web development", "AI studio"],
  authors: [{ name: "Agent Studio" }],
  openGraph: {
    title: "Agent Studio",
    description: "AI-powered multi-agent development dashboard",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
