import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers";
import { ThemeProvider } from "@/components/theme";

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

// Script anti-flash: aplica el tema antes de la hidratación para evitar parpadeo
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('tallerflow-theme');
    var theme = stored || 'system';
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = theme === 'dark' || (theme === 'system' && systemDark);
    if (isDark) document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          storageKey="tallerflow-theme"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-right" richColors closeButton />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
