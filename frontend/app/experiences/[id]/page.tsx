import { notFound } from 'next/navigation';
import { fetchExperienceById } from '@/lib/fetchExperience';
import ExperienceDetailClient from './ExperienceDetailClient';

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const experience = await fetchExperienceById(id);

  if (!experience) {
    notFound();
  }

  return <ExperienceDetailClient experience={experience} />;
}
