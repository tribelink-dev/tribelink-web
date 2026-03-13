'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useRef, type ReactNode } from 'react';
import { Home } from 'lucide-react';

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
    icon: <Home className="w-6 h-6 text-heritage-gold" />,
    description: 'Hosted stays',
    route: '/abodes'
  },
];

const experienceCategories: Category[] = [
  {
    id: 'artisan',
    label: 'Artisan Workshops',
    icon: '🎨',
    description: 'Hands-on crafts',
    route: '/trips/experiences?type=ARTISAN_WORKSHOP'
  },
  {
    id: 'performances',
    label: 'Performances',
    icon: '🎭',
    description: 'Cultural shows',
    route: '/trips/experiences?type=PERFORMANCE'
  },
  {
    id: 'events',
    label: 'Live Events',
    icon: '🎪',
    description: 'Concerts & festivals',
    route: '/events'
  },
  {
    id: 'cooking',
    label: 'Cooking Classes',
    icon: '👨‍🍳',
    description: 'Learn local recipes',
    route: '/trips/experiences?category=Cooking'
  },
  {
    id: 'tours',
    label: 'Cultural Tours',
    icon: '🗺️',
    description: 'Guided experiences',
    route: '/trips/experiences?category=Tour'
  },
];

export default function CategoryIcons({ section }: CategoryIconsProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const categories = section === 'localHosts' ? localHostCategories : experienceCategories;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newPosition = direction === 'right' 
        ? scrollPosition + scrollAmount 
        : scrollPosition - scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  if (categories.length === 0) return null;

  return (
    <div className="relative">
      {/* Scroll Buttons - only show if there are multiple categories */}
      {categories.length > 3 && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 flex items-center">
            <button
              onClick={() => handleScroll('left')}
              className="w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 flex items-center justify-end">
            <button
              onClick={() => handleScroll('right')}
              className="w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* Categories */}
      <div
        ref={scrollRef}
        className={`flex gap-8 overflow-x-auto scrollbar-hide pb-4 ${categories.length > 3 ? 'px-12' : 'px-0'}`}
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
            <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-3xl group-hover:border-heritage-gold transition-all group-hover:scale-110">
              {category.icon}
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-heritage-gold transition-colors">
                {category.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{category.description}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
