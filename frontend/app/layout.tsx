import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { CurrencyProvider } from "@/lib/CurrencyContext";
import ConditionalLayout from "@/components/ConditionalLayout";
import EmergencySOS from "@/components/EmergencySOS";
import DesktopViewport from "@/components/DesktopViewport";

export const metadata: Metadata = {
  title: "Tribelink - Authentic Global Journeys",
  description: "Discover amazing destinations, book unique experiences, and connect with authentic local hosts for your perfect journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DesktopViewport />
        <AuthProvider>
          <CurrencyProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <EmergencySOS />
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
