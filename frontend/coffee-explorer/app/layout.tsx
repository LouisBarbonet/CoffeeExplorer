import type { Metadata } from "next";
import { Fredoka, Nunito, Pixelify_Sans } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const pixelifySans = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CoffeeExplorer",
  description:
    "Your personal coffee-shop passport -- log the cafes you visit, rate them, and stamp your journal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} ${pixelifySans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
