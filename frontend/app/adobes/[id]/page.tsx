import { notFound } from 'next/navigation';
import { isValidObjectId } from '@/lib/seo';
import { fetchAbodeById } from '@/lib/fetchAbode';
import AbodeDetailClient from './AbodeDetailClient';

export default async function AbodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || !isValidObjectId(id)) {
    notFound();
  }

  const result = await fetchAbodeById(id);

  return (
    <AbodeDetailClient
      abodeId={id}
      initialAbode={result?.abode ?? null}
      initialLinkedExperiences={(result?.linkedExperiences ?? []) as never[]}
    />
  );
}
