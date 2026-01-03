'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Hero from '@/components/marketing/sections/Hero';
import Philosophy from '@/components/marketing/sections/Philosophy';
import Experiences from '@/components/marketing/sections/Experiences';
import CulturalImmersion from '@/components/marketing/sections/CulturalImmersion';
import Stories from '@/components/marketing/sections/Stories';
import Contact from '@/components/marketing/sections/Contact';

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Only redirect authenticated users, show marketing page to everyone else
    useEffect(() => {
        if (!loading && user) {
            // Check if user is a host
            if (typeof window !== 'undefined') {
                const userType = localStorage.getItem('userType');
                const hostData = localStorage.getItem('host');
                
                if (userType === 'host' && hostData) {
                    try {
                        const host = JSON.parse(hostData);
                        const providerType = host.providerType || 'EXPERIENCE_HOST';
                        // Import dynamically to avoid circular dependency
                        import('@/lib/providerUtils').then(({ getProviderDashboard }) => {
                            const dashboardRoute = getProviderDashboard(providerType);
                            router.push(dashboardRoute);
                        });
                        return;
                    } catch (e) {
                        router.push('/host/dashboard');
                        return;
                    }
                }
            }
            
            // Regular user flow - redirect to dashboard
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    // Show marketing page for unauthenticated users or while loading
    return (
        <div className="min-h-screen bg-off-white selection:bg-terracotta selection:text-white">
            <Hero />
            <Philosophy />
            <Experiences />
            <CulturalImmersion />
            <Stories />
            <Contact />
        </div>
    );
}
