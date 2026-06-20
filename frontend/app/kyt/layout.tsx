import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Know Your Traveler',
  robots: { index: false, follow: false },
};

export default function KytLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
