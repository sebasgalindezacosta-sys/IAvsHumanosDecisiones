import type { Metadata, Viewport } from "next";
import { ESTUDIO } from "@/data/estudio";
import "./globals.css";

export const metadata: Metadata = {
  title: ESTUDIO.titulo,
  description: `Estudio académico sobre decisiones cotidianas · ${ESTUDIO.institucion}`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#005436" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
