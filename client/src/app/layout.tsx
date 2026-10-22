import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/Providers";
import { CartProvider } from "../context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aurelle - Exceptional Dining Restaurant",
  description:
    "Exceptional dining, thoughtfully timed. A modern international restaurant concept.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('aurelle_theme') || localStorage.getItem('aurelle_staff_theme');
                  var theme = (saved === 'light' || saved === 'dark') ? saved : 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0F0F0F] text-[#ECE7DF] selection:bg-[#C1A87D] selection:text-black">
        <Providers>
          <CartProvider>
            <Suspense fallback={<div className="h-16 bg-transparent" />}>
              <Navbar />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Suspense fallback={null}>
              <Footer />
            </Suspense>
            <Suspense fallback={null}>
              <CartDrawer />
            </Suspense>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
