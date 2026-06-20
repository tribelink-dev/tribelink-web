'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AbodesRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', 'abodes');
    router.replace(`/explore?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-background pt-below-nav flex items-center justify-center">
      <p className="text-sm text-text-secondary">Redirecting to explore…</p>
    </div>
  );
}

export default function AbodesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background pt-below-nav" />}>
      <AbodesRedirect />
    </Suspense>
  );
}
