import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Montserrat, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-montserrat", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-jetbrains", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://watersense-theta.vercel.app";
const TITLE = "WaterSense · Agua, energía y futuro de tu rancho";
const DESCRIPTION = "Optimiza la energía de tus pozos, riega sin desperdicio y proyecta cuántos años le quedan a tu acuífero. Hecho para el campo de Chihuahua. (Demo · datos simulados con rangos reales).";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · WaterSense" },
  description: DESCRIPTION,
  applicationName: "WaterSense",
  keywords: ["agua", "riego", "pozos", "acuífero", "Chihuahua", "agricultura", "CENACE", "CONAGUA", "energía", "agtech"],
  authors: [{ name: "WaterSense" }],
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: SITE_URL,
    siteName: "WaterSense",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/landing/hero.jpg", width: 1200, height: 630, alt: "WaterSense — panel de riego y pozos para Chihuahua" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/landing/hero.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${montserrat.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
