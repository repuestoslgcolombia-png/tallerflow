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
  title: {
    default: 'TallerFlow — Gestión de Talleres de Electrodomésticos',
    template: '%s · TallerFlow',
  },
  description: "Sistema integral de gestión para talleres de reparación de electrodomésticos del hogar: lavadoras, neveras, congeladores, secadoras a gas, aires acondicionados y TVs. Órdenes de trabajo, cotizaciones, inventario y WhatsApp en un solo lugar.",
  keywords: ["TallerFlow", "taller", "electrodomésticos", "reparación", "lavadoras", "neveras", "aires acondicionados", "gestión", "ERP", "órdenes de trabajo", "cotizaciones", "inventario", "facturación", "WhatsApp"],
  authors: [{ name: "TallerFlow" }],
  creator: "TallerFlow",
  applicationName: "TallerFlow",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-mark.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "TallerFlow",
    "mobile-web-app-capable": "yes",
    "theme-color": "#0E86CD",
  },
  openGraph: {
    title: "TallerFlow — Gestión de Talleres de Electrodomésticos",
    description: "Del papel y WhatsApp al control total: órdenes claras, clientes informados y un negocio que escala.",
    type: "website",
    locale: "es_CO",
    siteName: "TallerFlow",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TallerFlow — Gestión de talleres de electrodomésticos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TallerFlow — Gestión de Talleres de Electrodomésticos",
    description: "Del papel y WhatsApp al control total: órdenes claras, clientes informados y un negocio que escala.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
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
