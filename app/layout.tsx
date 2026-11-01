import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shreekar No Hisab - PaisaNakhne",
  description: "Smart personal and shared expense tracker, yearly monthwise analytics, and customer khata.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
