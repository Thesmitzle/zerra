import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zerra — Zero-Knowledge Encrypted Chat",
  description:
    "Privacy-first, end-to-end encrypted ephemeral chat. The server never sees your messages.",
  icons: {
  icon: [
    { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
  ],
  apple: [
    { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  ],
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
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-bg text-text-primary antialiased">{children}</body>
    </html>
  );
}
