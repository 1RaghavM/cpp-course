import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "cpproad",
  description: "A single-user C++ learning tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-base text-primary">{children}</body>
    </html>
  );
}
