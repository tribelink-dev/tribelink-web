import { notFound } from 'next/navigation';
import { isValidObjectId } from '@/lib/seo';
import { fetchExperienceById } from '@/lib/fetchExperience';
import ExperienceDetailClient from './ExperienceDetailClient';

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || !isValidObjectId(id)) {
    notFound();
  }

  const experience = await fetchExperienceById(id);

  return <ExperienceDetailClient experienceId={id} initialExperience={experience} />;
}
