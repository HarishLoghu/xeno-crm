import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Xeno CRM — AI-Powered Customer Intelligence",
  description:
    "Intelligent CRM powered by AI. Manage customers, run campaigns, and surface actionable insights with the Xeno Mini CRM platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${font.variable} h-full antialiased dark`}>
      <body className="min-h-screen bg-[#0a0b14] text-slate-100 font-sans">
        <Sidebar />
        <main className="lg:pl-64 min-h-screen">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
