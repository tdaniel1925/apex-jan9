import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ErrorHandler } from "@/components/error-handler";
import { Toaster } from "sonner";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Apex Affinity Group | Build Your Insurance Career',
    template: '%s | Apex Affinity Group',
  },
  description: 'Join Apex Affinity Group and build your insurance career. Access top carriers, earn competitive commissions, and grow your team with AI-powered tools.',
  keywords: [
    'insurance career',
    'insurance agent',
    'life insurance',
    'Apex Affinity Group',
    'insurance opportunity',
    'insurance commissions',
    'build insurance team',
    'Columbus Life',
    'AIG insurance',
    'F&G annuities',
  ],
  authors: [{ name: 'Apex Affinity Group' }],
  creator: 'Apex Affinity Group',
  publisher: 'Apex Affinity Group',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'Apex Affinity Group',
    title: 'Apex Affinity Group | Build Your Insurance Career',
    description: 'Join Apex Affinity Group and build your insurance career. Access top carriers, earn competitive commissions, and grow your team.',
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Apex Affinity Group - Build Your Insurance Career',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apex Affinity Group | Build Your Insurance Career',
    description: 'Join Apex Affinity Group and build your insurance career with top carriers and AI-powered tools.',
    images: [`${APP_URL}/og-image.png`],
    creator: '@TheApexWay',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these when you have the verification codes
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  icons: {
    icon: '/images/icon.png',
    shortcut: '/images/icon.png',
    apple: '/images/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <ErrorHandler />
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
