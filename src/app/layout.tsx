import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers";
import { ThemeProvider } from "@/components/theme";
import { AssistantWidget } from "@/modules/assistant/assistant-widget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TallerFlow — Gestión de Talleres de Electrodomésticos",
  description: "Sistema integral de gestión para talleres de reparación de electrodomésticos del hogar: lavadoras, neveras, congeladores, secadoras a gas, aires acondicionados y TVs.",
  keywords: ["taller", "electrodomésticos", "reparación", "lavadoras", "neveras", "aires acondicionados", "gestión", "ERP", "órdenes de trabajo", "cotizaciones", "inventario"],
  authors: [{ name: "TallerFlow" }],
  icons: {
    icon: "/logo.svg",
    apple: "/icon-192.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "TallerFlow",
    "mobile-web-app-capable": "yes",
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
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
      >
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
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
            <AssistantWidget />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
