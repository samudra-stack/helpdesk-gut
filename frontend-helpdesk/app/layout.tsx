import "./globals.css";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" translate="no">
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} notranslate bg-background font-body-default text-body-default`}
      >
        {children}
      </body>
    </html>
  );
}
