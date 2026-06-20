import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plan your trip',
  description:
    'Plan your trip with Triberoutes. Choose dates and regions, and we will suggest a curated mix of local abodes and experiences to form a human-feeling first-draft itinerary you can refine.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TripsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
