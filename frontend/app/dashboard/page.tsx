'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { Calendar, Heart, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/ui/PageContainer';

export default function TravelerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isHost = localStorage.getItem('userType') === 'host' || !!localStorage.getItem('host');
    if (isHost) {
      router.replace('/host/dashboard');
      return;
    }
    if (!user) {
      router.replace('/login?returnTo=/dashboard');
      return;
    }
    api.get('/bookings').then((r) => {
      const bookings = r.data?.bookings || [];
      setUpcomingCount(bookings.filter((b: any) => b.status !== 'cancelled').length);
    }).catch(() => {});
  }, [user, router]);

  if (!user) return null;

  const cards = [
    { href: '/bookings', icon: Calendar, label: 'Trips', desc: `${upcomingCount} booking${upcomingCount !== 1 ? 's' : ''}`, },
    { href: '/dashboard/bucketlist', icon: Heart, label: 'Bucketlist', desc: 'Homestays & experiences' },
    { href: '/dashboard/profile', icon: User, label: 'Profile', desc: 'Account settings' },
    { href: '/explore', icon: MapPin, label: 'Explore', desc: 'Find your next stay' },
  ];

  return (
    <PageContainer className="pb-8">
      <h1 className="text-2xl font-semibold text-text-primary mb-1">
        Welcome back, {user.name?.split(' ')[0]}
      </h1>
      <p className="text-sm text-text-secondary mb-8">Manage your trips and account</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="p-6 rounded-xl border border-border bg-surface hover:shadow-card transition-shadow"
          >
            <Icon className="w-6 h-6 text-brand mb-3" />
            <h2 className="font-semibold text-text-primary">{label}</h2>
            <p className="text-sm text-text-secondary mt-1">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 p-6 rounded-xl border border-border bg-surface">
        <h2 className="font-semibold text-text-primary mb-2">Plan your next cultural trip</h2>
        <p className="text-sm text-text-secondary mb-4">
          Combine a family homestay with local experiences for an authentic journey.
        </p>
        <Button onClick={() => router.push('/trips/select')}>Plan a trip</Button>
      </div>
    </PageContainer>
  );
}
