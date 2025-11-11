import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import EmergencySOS from "@/components/EmergencySOS";

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
        <AuthProvider>
          <Navbar />
          {children}
          <EmergencySOS />
        </AuthProvider>
      </body>
    </html>
  );
}

