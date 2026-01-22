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
    // Show marketing page to everyone - no authentication required
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
