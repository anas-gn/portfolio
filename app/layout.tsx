import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANAS GANA — Software engineer",
  description:
    "Portfolio d'Anas Gana, software engineer (Flutter, Next.js, Spring Boot, DevOps) — Master 2 RSI, FST Settat.",
  openGraph: {
    title: "ANAS GANA — Software engineer",
    description: "Mobile, web, serveur et sécurité : projets, parcours et activité GitHub.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#090a0b",
};

// Applies the saved (or system) theme before first paint to avoid a flash.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
         <link rel="icon" href="https://seeklogo.com/vector-logo/330361/formula-1" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
