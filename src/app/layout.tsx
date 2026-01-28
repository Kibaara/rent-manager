// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/main-nav"; // Import the component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rent Manager",
  description: "Professional Property Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen`}>
        {/* 1. Add Navigation Bar Here */}
        <MainNav />
        
        {/* 2. Page Content */}
        <main className="max-w-7xl mx-auto px-4 pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}