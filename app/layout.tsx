import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "sonner";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pure Flow - Gym Tracker",
  description:
    "Track your gym workouts with minimal friction. Log exercises, track progressive overload, and build your strength.",
  icons: {
    icon: "/logo-mad.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          {process.env.NODE_ENV === "production" && <Analytics />}
          <Toaster position="top-center" richColors theme="system" />
        </AuthProvider>
      </body>
    </html>
  );
}
