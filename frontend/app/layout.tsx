import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { CurrencyProvider } from "@/lib/CurrencyContext";
import { CartProvider } from "@/lib/CartContext";
import { SavedProvider } from "@/lib/SavedContext";
import ConditionalLayout from "@/components/ConditionalLayout";
import EmergencySOS from "@/components/EmergencySOS";
import StructuredData from "@/components/StructuredData";
import { getBaseUrl, getDefaultOgImage } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const baseUrl = getBaseUrl();
const defaultImage = getDefaultOgImage();
const googleVerification =
  process.env.GOOGLE_SITE_VERIFICATION || 'Vm6JYc-k5KbC_rxdhImNEkqOGot2R9psJDzJ7-ULVr0';
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Triberoutes - Kerala Homestays & Cultural Experiences",
    template: "%s | Triberoutes",
  },
  description:
    "Live with a Keralite family. Book verified Kerala homestays and traditional cultural experiences curated and guided by local hosts. For international and Indian travelers seeking cultural understanding.",
  keywords: [
    "Kerala homestay",
    "stay with local family Kerala",
    "live like a Keralite",
    "Kerala cultural experiences",
    "traditional Kerala activities",
    "authentic Kerala homestay",
    "cultural tourism Kerala",
    "triberoutes",
    "guided by local host Kerala",
    "Kerala cultural immersion",
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
    url: `${baseUrl}/explore`,
    siteName: "Triberoutes",
    title: "Triberoutes - Kerala Homestays & Cultural Experiences",
    description:
      "Live with a Keralite family. Book verified Kerala homestays and traditional cultural experiences guided by local hosts.",
    images: [
      {
        url: defaultImage,
        width: 1200,
        height: 630,
        alt: "Triberoutes - Kerala Homestays & Cultural Experiences",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Triberoutes - Kerala Homestays & Cultural Experiences",
    description:
      "Live with a Keralite family. Book verified Kerala homestays and traditional cultural experiences guided by local hosts.",
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
    google: googleVerification,
  },
  alternates: {
    canonical: `${baseUrl}/explore`,
  },
  category: "Travel",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#FEFDFB',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        <StructuredData />
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <SavedProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
              <EmergencySOS />
              </SavedProvider>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
        <SpeedInsights />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
