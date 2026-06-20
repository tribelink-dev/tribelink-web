'use client';

import { Star } from 'lucide-react';

interface AbodeReviewsSectionProps {
  rating: number;
  ratingCount: number;
}

export default function AbodeReviewsSection({ rating, ratingCount }: AbodeReviewsSectionProps) {
  if (rating <= 0) {
    return (
      <section className="py-6 sm:py-8 border-t border-border">
        <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-2">Reviews</h2>
        <p className="text-sm text-text-secondary">No reviews yet. Be the first to stay with this family.</p>
      </section>
    );
  }

  const categories = [
    { label: 'Cultural experience', score: rating },
    { label: 'Communication', score: Math.min(5, rating + 0.1) },
    { label: 'Cleanliness', score: rating },
    { label: 'Accuracy', score: rating },
  ];

  return (
    <section className="py-6 sm:py-8 border-t border-border">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Star className="w-5 h-5 fill-text-primary text-text-primary shrink-0" />
        <h2 className="text-lg sm:text-xl font-semibold text-text-primary">
          {rating.toFixed(2)} · {ratingCount} review{ratingCount !== 1 ? 's' : ''}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        {categories.map((cat) => (
          <div key={cat.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">{cat.label}</span>
              <span className="text-text-primary font-medium">{cat.score.toFixed(1)}</span>
            </div>
            <div className="h-1 bg-surface-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-text-primary rounded-full"
                style={{ width: `${(cat.score / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-text-secondary">
        Reviews from guests who stayed with this family host.
      </p>
    </section>
  );
}
