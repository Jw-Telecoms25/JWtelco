import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JWTelecoms — Instant Recharge & Digital Services",
  description:
    "Nigeria's trusted VTU platform for instant airtime, data bundles, bill payments, and more. Fast, reliable, and affordable.",
  keywords: ["VTU", "airtime", "data", "Nigeria", "recharge", "bills"],
  icons: {
    icon: "/jw-logo.jpg",
    apple: "/jw-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${jakarta.variable} antialiased`}>
        <SupabaseProvider>
          <AuthProvider>
            {children}
            <ToastProvider />
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
