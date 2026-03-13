import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plan with Local Abodes',
  description:
    'Plan your trip around local abodes. Pick your regions and dates, then find stays that bundle accommodation, food, and experiences. Build a day-by-day plan anchored by abodes.',
};

export default function TripsAbodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
