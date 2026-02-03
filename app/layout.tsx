import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vercel Sandbox Agent",
  description: "AI coding assistant with sandbox environments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
