import { Marcellus, Manrope, IBM_Plex_Mono } from "next/font/google";
import MetaPixel from "@/components/MetaPixel";
import "./globals.css";

const display = Marcellus({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-display", display: "swap" });
const body = Manrope({ subsets: ["latin", "latin-ext", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(site),
  title: "Boulevard City — Samarqand, Muqimiy 48 | Xonadonlar 3D ko'rinishda",
  description: "Boulevard City turar joy majmuasi: 1, 2, 3 va 4 xonali xonadonlar, terrasali penthauslar, podval avtoturargohi va basseyn. Har bir xonadonni 3D ko'rinishda tanlang.",
  openGraph: { title: "Boulevard City — Samarqand", description: "Xonadonlarni 3D ko'rinishda tanlang. Muqimiy ko'chasi, 48.", locale: "uz_UZ", type: "website" },
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1e3d8c" };

export default function RootLayout({ children }) {
  return (
    <html lang="uz" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
