import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zerra — Zero-Knowledge Encrypted Chat",
  description:
    "Privacy-first, end-to-end encrypted ephemeral chat. The server never sees your messages.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Zerra",
    description: "End-to-end encrypted. Zero knowledge. Self-destructing.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-text-primary antialiased">{children}</body>
    </html>
  );
}
