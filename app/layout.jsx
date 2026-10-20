import { Montserrat, Lora } from "next/font/google";
import MetaPixel from "@/components/MetaPixel";
import Motion from "@/components/Motion";
import "./globals.css";

const sans = Montserrat({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-sans", display: "swap" });
const serif = Lora({ subsets: ["latin", "latin-ext", "cyrillic"], style: "italic", weight: ["500", "600"], variable: "--font-serif", display: "swap" });

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(site),
  title: "Boulevard City — Samarqand, Muqimiy 48 | Xonadonlar 3D ko'rinishda",
  description: "Boulevard City turar joy majmuasi: 1, 2, 3 va 4 xonali xonadonlar, terrasali penthauslar, podval avtoturargohi va basseyn. Har bir xonadonni 3D ko'rinishda tanlang.",
  openGraph: { title: "Boulevard City — Samarqand", description: "Xonadonlarni 3D ko'rinishda tanlang. Muqimiy ko'chasi, 48.", locale: "uz_UZ", type: "website" },
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
