import type { Metadata } from "next";
import { Amiri, Outfit, Schibsted_Grotesk, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// The one typeface of the interface.
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

// The logo only.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic"],
  preload: false,
});

// A book serif used only on the will itself, so the document looks like a
// document. Not preloaded: most pages never show it.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  preload: false,
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
      className={`${schibsted.variable} ${outfit.variable} ${amiri.variable} ${sourceSerif.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
