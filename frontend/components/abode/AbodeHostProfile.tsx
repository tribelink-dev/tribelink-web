'use client';

import Image from 'next/image';
import { Star, Shield, Languages } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import { Badge } from '@/components/ui/Badge';

interface AbodeHostProfileProps {
  host: {
    name: string;
    profilePicture?: string;
    rating?: number;
  };
  familyInfo?: {
    familySize?: number;
    background?: string;
    generations?: number;
  };
  languages?: string[];
  isVerified?: boolean;
}

export default function AbodeHostProfile({
  host,
  familyInfo,
  languages = [],
  isVerified,
}: AbodeHostProfileProps) {
  return (
    <section className="py-8 border-t border-border">
      <h2 className="text-xl font-semibold text-text-primary mb-6">Meet your host</h2>
      <div className="flex items-start gap-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-surface-muted shrink-0">
          {host.profilePicture ? (
            <Image
              src={getImageUrl(host.profilePicture) || ''}
              alt={host.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-text-secondary">
              {host.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-text-primary">Hosted by {host.name}</h3>
            {isVerified && (
              <Badge variant="success" className="gap-1">
                <Shield className="w-3 h-3" />
                Verified family host
              </Badge>
            )}
          </div>
          {familyInfo?.familySize && (
            <p className="text-sm text-text-secondary mt-1">
              {familyInfo.familySize}-member family
              {familyInfo.generations ? ` · ${familyInfo.generations} generations` : ''}
            </p>
          )}
          {languages.length > 0 && (
            <p className="text-sm text-text-secondary mt-1 flex items-center gap-1">
              <Languages className="w-4 h-4" />
              Speaks {languages.join(', ')}
            </p>
          )}
          {host.rating && host.rating > 0 && (
            <p className="text-sm text-text-secondary mt-1 flex items-center gap-1">
              <Star className="w-4 h-4 fill-text-primary text-text-primary" />
              {host.rating.toFixed(1)} host rating
            </p>
          )}
          {familyInfo?.background && (
            <p className="text-sm text-text-secondary mt-4 leading-relaxed">{familyInfo.background}</p>
          )}
        </div>
      </div>
    </section>
  );
}
