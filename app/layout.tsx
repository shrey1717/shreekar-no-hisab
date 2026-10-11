import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HisabMate",
  description: "A friendly shared expense tracker for hostel groups and roommates.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
