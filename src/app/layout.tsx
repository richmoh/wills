import type { Metadata } from "next";
import { Amiri, Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Wasiyyah — Your Islamic will, done properly",
    template: "%s · Wasiyyah",
  },
  description:
    "Make an Islamic will drafted for England & Wales in about 15 minutes. Exact Qur'anic shares with the working shown, clear English, free to start.",
  openGraph: {
    title: "Wasiyyah — Your Islamic will, done properly",
    description:
      "A will that follows the Qur'anic shares, drafted for England & Wales, from a 15-minute guided interview.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
