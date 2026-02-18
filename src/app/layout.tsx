import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { unstable_noStore as noStore } from "next/cache";
import AuthRefresh from "@/components/AuthRefresh";
import { requireRole } from "@/lib/rbac";
import { cookies } from "next/headers";
import FlashToast from "@/components/FlashToast";


export const dynamic = "force-dynamic";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Electronic Diary",
  description: "School system",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  noStore();

  const cookieStore = await cookies();
  const flash = cookieStore.get("flash")?.value;

return (
  <html lang="ru">
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <Navbar />
      <AuthRefresh />

      {flash && <FlashToast message={flash} />}

      {children}
    </body>
  </html>
);
}

