import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shreekar No Hisab",
  description: "Smart personal and shared expense tracker, yearly monthwise analytics, and customer khata.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <Script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js" strategy="afterInteractive" />
      <Script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js" strategy="afterInteractive" />
      <body className="min-h-full">{children}</body>
    </html>
  );
}
