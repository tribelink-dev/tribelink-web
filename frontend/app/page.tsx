'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, lazy, Suspense } from 'react';
import Hero from '@/components/marketing/sections/Hero';

// Lazy load below-the-fold sections for better initial page load
const Philosophy = lazy(() => import('@/components/marketing/sections/Philosophy'));
const Experiences = lazy(() => import('@/components/marketing/sections/Experiences'));
const CulturalImmersion = lazy(() => import('@/components/marketing/sections/CulturalImmersion'));
const Stories = lazy(() => import('@/components/marketing/sections/Stories'));
const Contact = lazy(() => import('@/components/marketing/sections/Contact'));

// Loading placeholder for lazy-loaded sections
const SectionLoader = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-deep-jungle/40">Loading...</div>
    </div>
);

// Note: Metadata is handled by root layout.tsx since this is a client component
// The root layout provides comprehensive SEO metadata for the homepage
export default function Home() {
    // Show marketing page to everyone - no authentication required
    return (
        <div className="min-h-screen bg-off-white selection:bg-terracotta selection:text-white">
            <Hero />
            <Suspense fallback={<SectionLoader />}>
                <Philosophy />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <Experiences />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <CulturalImmersion />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <Stories />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
                <Contact />
            </Suspense>
        </div>
    );
}
