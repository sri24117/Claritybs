import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClarityBS: your sugar report, explained in simple language",
  description:
    "Send your HbA1c, fasting and post-meal sugar numbers on WhatsApp. A dietician explains them in plain language and helps you build food habits that fit your life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
