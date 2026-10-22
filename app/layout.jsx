import { Montserrat, Lora } from "next/font/google";
import MetaPixel from "@/components/MetaPixel";
import Motion from "@/components/Motion";
import "./globals.css";

const sans = Montserrat({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-sans", display: "swap" });
const serif = Lora({ subsets: ["latin", "latin-ext", "cyrillic"], style: "italic", weight: ["500", "600"], variable: "--font-serif", display: "swap" });

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(site),
  title: "Tamerlan — Bulvar maydondan 300 metrda premium uylar | Samarqand",
  description: "Tamerlan turar joy majmuasi: 1 va 2 xonali xonadonlar, penthauslar, yer osti avtoturargohi va garaj. Har bir xonadonning haqiqiy rejasini ko'ring va narxini bilib oling.",
  openGraph: { title: "Tamerlan — Samarqand", description: "Bulvar maydondan 300 metr masofada premium uylar. Har bir xonadon 3D maketda.", locale: "uz_UZ", type: "website" },
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#032a25" };

export default function RootLayout({ children }) {
  return (
    <html lang="uz" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {children}
        <Motion />
        <MetaPixel />
      </body>
    </html>
  );
}
