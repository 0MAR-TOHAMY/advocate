import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, localeDirections } from '@/lib/config/i18n.config';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import localFont from 'next/font/local';
import "../globals.css";

const aviner = localFont({
  src: '../../fonts/Aviner.otf',
  variable: '--font-aviner',
  display: 'swap',
});

const stc = localFont({
  src: [
    {
      path: '../../fonts/STC/STC-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../fonts/STC/STC-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-stc',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "Advocate | Legal Case Management System",
    template: "%s | Advocate",
  },
  description:
    "A modern legal case management system designed for law firms to manage clients, cases, hearings, documents and workflows efficiently.",
  keywords: [
    "legal",
    "case management",
    "law firm software",
    "clients",
    "hearings",
    "court sessions",
    "lawyers system",
  ],

  applicationName: "Advocate",
  authors: [{ name: "Omar Tohamy" }],
  generator: "Next.js 16",
  creator: "Omar Tohamy",
  publisher: "Legal SaaS",

  metadataBase: new URL("https://your-domain.com"),

  robots: {
    index: true,
    follow: true,
    nocache: false,
  },

  openGraph: {
    type: "website",
    url: "https://your-domain.com",
    title: "Advocate",
    description:
      "Powerful legal case and client management platform for lawyers and law firms.",
    siteName: "Advocate",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Advocate",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Advocate",
    description:
      "A modern case & client management system for law firms and lawyers.",
    images: ["/og-image.png"],
  },

  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Advocate",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light dark",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const direction = localeDirections[locale as keyof typeof localeDirections];

  return (
    <html lang={locale} dir={direction} className={`${stc.variable} ${aviner.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Advocate" />
      </head>
      <body className={`${stc.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <NotificationsProvider>
              {children}
            </NotificationsProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
