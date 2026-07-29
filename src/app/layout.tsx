import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { getSiteSettings } from "@/lib/settings";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["300", "400", "500"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", weight: ["400", "500", "600"] });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const description = s.meta_description ?? "Handcrafted American solid-wood furniture, built to be handed down.";
  return {
    title: s.site_title || "GS Chairs",
    description,
    openGraph: {
      title: s.site_title || "GS Chairs",
      description,
      images: s.og_image_url ? [{ url: s.og_image_url }] : undefined,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
