import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { CurrencyProvider } from "@/lib/CurrencyContext";
import { CartProvider } from "@/lib/CartContext";
import ConditionalLayout from "@/components/ConditionalLayout";
import EmergencySOS from "@/components/EmergencySOS";
import DesktopViewport from "@/components/DesktopViewport";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, validateImageUrl } from "@/lib/seo";

const baseUrl = getBaseUrl();
const defaultImage = validateImageUrl('/assets/logo.jpg') || `${baseUrl}/assets/logo.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Triberoutes - Authentic Local Experiences & Cultural Stays",
    template: "%s | Triberoutes",
  },
  description: "Discover authentic local experiences, book unique cultural stays, and connect with local hosts for your perfect journey. Experience real travel with Triberoutes.",
  keywords: [
    "authentic travel experiences",
    "local homestays",
    "cultural tourism",
    "tribe routes",
    "triberoutes",
    "authentic local experiences",
    "cultural homestays",
    "local hosts",
    "cultural immersion",
    "authentic travel",
  ],
  authors: [{ name: "Triberoutes" }],
  creator: "Triberoutes",
  publisher: "Triberoutes",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Triberoutes",
    title: "Triberoutes - Authentic Local Experiences & Cultural Stays",
    description: "Discover authentic local experiences, book unique cultural stays, and connect with local hosts for your perfect journey.",
    images: [
      {
        url: defaultImage,
        width: 1200,
        height: 630,
        alt: "Triberoutes - Authentic Travel Experiences",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Triberoutes - Authentic Local Experiences & Cultural Stays",
    description: "Discover authentic local experiences, book unique cultural stays, and connect with local hosts for your perfect journey.",
    images: [defaultImage],
    creator: "@triberoutes",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification codes when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
  alternates: {
    canonical: baseUrl,
  },
  category: "Travel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StructuredData />
        <DesktopViewport />
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
              <EmergencySOS />
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
