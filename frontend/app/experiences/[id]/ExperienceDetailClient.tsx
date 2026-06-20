'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/lib/CurrencyContext';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MapPin, Star, ChevronLeft, Clock, Users } from 'lucide-react';
import type { ExperienceData } from '@/lib/fetchExperience';

interface ExperienceDetailClientProps {
  experience: ExperienceData;
}

export default function ExperienceDetailClient({ experience }: ExperienceDetailClientProps) {
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const location = experience.location
    ? [experience.location.district, experience.location.state || 'Kerala']
        .filter(Boolean)
        .join(', ')
    : 'Kerala, India';
  const imageSrc = experience.imageUrl ? getImageUrl(experience.imageUrl) : null;
  const imageAlt = `${experience.title} in ${location}, Kerala`;

  return (
    <div className="min-h-screen bg-background pt-below-nav pb-bottom-bar lg:pb-16">
      <div className="px-page lg:px-page-lg">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {imageSrc && (
        <div className="px-page lg:px-page-lg mb-6">
          <div className="relative aspect-[16/9] rounded-card overflow-hidden bg-surface-muted">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}

      <PageContainer width="constrained" belowNav={false} className="pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">
                {experience.title}
              </h1>
              {location && (
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin className="w-4 h-4" />
                  {location}
                </p>
              )}
              {(experience.averageRating ?? 0) > 0 && (
                <p className="flex items-center gap-1 text-sm text-text-primary mt-2">
                  <Star className="w-4 h-4 fill-brand text-brand" />
                  {experience.averageRating!.toFixed(1)}
                  {(experience.reviewCount ?? 0) > 0 && (
                    <span className="text-text-secondary">({experience.reviewCount} reviews)</span>
                  )}
                </p>
              )}
            </div>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-3">About this experience</h2>
              <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                {experience.description}
              </p>
            </section>

            {experience.provider && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-2">Your host</h2>
                <p className="font-medium text-text-primary">{experience.provider.name}</p>
                {(experience.provider.rating ?? 0) > 0 && (
                  <p className="text-sm text-text-secondary mt-1">
                    Host rating {experience.provider.rating!.toFixed(1)}
                  </p>
                )}
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-28">
              <p className="text-2xl font-semibold text-text-primary mb-1">
                {formatPrice(experience.price, experience.currency || 'INR')}
              </p>
              <p className="text-sm text-text-secondary mb-4">per person</p>
              <div className="space-y-2 text-sm text-text-secondary mb-6">
                {experience.duration && (
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {experience.duration} hours
                  </p>
                )}
                {experience.maxParticipants && (
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Up to {experience.maxParticipants} guests
                  </p>
                )}
              </div>
              <Button className="w-full" onClick={() => router.push('/trips/experiences')}>
                Book experience
              </Button>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
