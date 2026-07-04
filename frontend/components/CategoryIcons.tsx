'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  label: string;
  icon: ReactNode;
  description: string;
  route: string;
}

interface CategoryIconsProps {
  section: 'localHosts' | 'experiences';
}

const localHostCategories: Category[] = [
  {
    id: 'abodes',
    label: 'Abodes',
    icon: <Home className="w-4 h-4" />,
    description: 'Hosted stays',
    route: '/abodes',
  },
];

const experienceCategories: Category[] = [
  {
    id: 'artisan',
    label: 'Artisan Workshops',
    icon: '🎨',
    description: 'Hands-on crafts',
    route: '/trips/experiences?type=ARTISAN_WORKSHOP',
  },
  {
    id: 'performances',
    label: 'Performances',
    icon: '🎭',
    description: 'Cultural shows',
    route: '/trips/experiences?type=PERFORMANCE',
  },
  {
    id: 'events',
    label: 'Live Events',
    icon: '🎪',
    description: 'Concerts & festivals',
    route: '/events',
  },
  {
    id: 'cooking',
    label: 'Cooking Classes',
    icon: '👨‍🍳',
    description: 'Learn local recipes',
    route: '/trips/experiences?category=Cooking',
  },
  {
    id: 'tours',
    label: 'Cultural Tours',
    icon: '🗺️',
    description: 'Guided experiences',
    route: '/trips/experiences?category=Tour',
  },
];

export default function CategoryIcons({ section }: CategoryIconsProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const categories = section === 'localHosts' ? localHostCategories : experienceCategories;

  if (categories.length === 0) return null;

  return (
    <div className="relative mb-3 md:mb-4">
      {/* Mobile: compact scrollable pills */}
      <div
        ref={scrollRef}
        className="md:hidden -mx-page px-page flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => router.push(category.route)}
            className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-surface text-sm font-medium text-text-primary hover:border-text-secondary/50 active:scale-[0.98] transition-transform touch-target"
          >
            <span className="text-base leading-none">{category.icon}</span>
            <span className="whitespace-nowrap">{category.label}</span>
          </button>
        ))}
      </div>

      {/* Desktop: icon circles */}
      <div
        className="hidden md:flex gap-8 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => router.push(category.route)}
            className="flex flex-col items-center gap-3 min-w-[100px] group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-surface border-2 border-border flex items-center justify-center text-3xl group-hover:border-brand transition-all group-hover:scale-110">
              {category.icon}
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-text-primary group-hover:text-brand transition-colors">
                {category.label}
              </div>
              <div className="text-xs text-text-secondary mt-0.5">{category.description}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
