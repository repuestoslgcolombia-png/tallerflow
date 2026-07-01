import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TallerFlow — Gestión de Talleres",
  description: "Sistema integral de gestión para talleres de reparación de equipos. Clientes, equipos, órdenes de trabajo, cotizaciones e inventario.",
  keywords: ["taller", "reparación", "gestión", "ERP", "órdenes de trabajo", "cotizaciones", "inventario"],
  authors: [{ name: "TallerFlow" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "TallerFlow",
    description: "Gestión moderna para talleres de reparación",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          {children}
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton />
        </QueryProvider>
      </body>
    </html>
  );
}
