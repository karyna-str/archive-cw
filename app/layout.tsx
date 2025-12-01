import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import {ClerkProvider} from '@clerk/nextjs'
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Мій Архів",
  description: "Особиста бібліотека текстів",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <ClerkProvider>
          <html lang="en" suppressHydrationWarning>
          <body className={inter.className}>
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
          <Header />
          {}
          {children}
          </ThemeProvider>
          </body>
          </html>
      </ClerkProvider>
  );
}
