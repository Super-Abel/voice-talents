import type { Metadata, Viewport } from "next";
import { Anton, Kanit } from "next/font/google";
import "./globals.css";

/* Anton : capitales condensées pour la typo cinétique. Kanit : corps semi-condensé, lisible sur mobile. */
const heading = Anton({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
const body = Kanit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const description =
  "Voice Talent – Édition spéciale Douala 2026 : la compétition qui révèle les nouvelles voix du Cameroun. Inscriptions, votes et billetterie officiels.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Voice Talent – Édition spéciale Douala 2026",
    template: "%s · Voice Talent Douala 2026",
  },
  description,
  openGraph: {
    type: "website",
    locale: "fr_CM",
    siteName: "Voice Talent",
    title: "Voice Talent – Édition spéciale Douala 2026",
    description,
    images: [
      {
        url: "/brand/voice-talent-the-bridge.jpg",
        width: 1000,
        height: 1000,
        alt: "Logo Voice Talent – The Bridge",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Voice Talent – Édition spéciale Douala 2026",
    description,
    images: ["/brand/voice-talent-the-bridge.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#240046",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
