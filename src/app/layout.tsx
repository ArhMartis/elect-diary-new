import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { unstable_noStore as noStore } from "next/cache";
import AuthRefresh from "@/components/AuthRefresh";
import { requireRole } from "@/lib/rbac";
import { cookies } from "next/headers";
import FlashToast from "@/components/FlashToast";
import { ThemeProvider } from "@/components/ThemeProvider";


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
  title: "KnowledgeBY",
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
  <html lang="ru" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.add('dark')}else if(t==='light'){document.documentElement.setAttribute('data-theme','light');document.documentElement.classList.remove('dark')}else if(!t||t==='system'){var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(d){document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.add('dark')}else{document.documentElement.setAttribute('data-theme','light');document.documentElement.classList.remove('dark')}}}catch(e){}})()` }} />
    </head>
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased pt-16`}>
      <ThemeProvider>
        <Navbar />
        <AuthRefresh />

        {flash && <FlashToast message={flash} />}

        {children}
      </ThemeProvider>
    </body>
  </html>
);
}

