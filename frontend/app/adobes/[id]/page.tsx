import { notFound } from 'next/navigation';
import { fetchAbodeById } from '@/lib/fetchAbode';
import AbodeDetailClient from './AbodeDetailClient';

export default async function AbodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchAbodeById(id);

  if (!result) {
    notFound();
  }

  return (
    <AbodeDetailClient
      abodeId={id}
      initialAbode={result.abode}
      initialLinkedExperiences={result.linkedExperiences as never[]}
    />
  );
}
