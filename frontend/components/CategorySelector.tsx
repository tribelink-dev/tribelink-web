'use client';

import { useState } from 'react';

export interface CategoryOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  subcategories: {
    id: string;
    name: string;
    description: string;
  }[];
}

export const EXPERIENCE_CATEGORIES: CategoryOption[] = [
  {
    id: 'living-with-the-land',
    name: 'Living with the Land',
    description: 'Nature, Wildlife & Agriculture - Shifting from "observation" to "stewardship"',
    icon: '🌿',
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    subcategories: [
      {
        id: 'wildlife-conservation',
        name: 'Wildlife & Conservation',
        description: 'Tracking, rehabilitation, and protecting species with local rangers'
      },
      {
        id: 'eco-trekking',
        name: 'Eco-Trekking & Endemics',
        description: 'Focusing on rare flora and landscapes found nowhere else'
      },
      {
        id: 'regenerative-farming',
        name: 'Regenerative Farming',
        description: 'Hands-on experience with ancestral farming, harvesting, and livestock tending'
      }
    ]
  },
  {
    id: 'stories-of-the-past',
    name: 'Stories of the Past',
    description: 'Heritage, History & Architecture - Moving beyond "Walks" to "Living History"',
    icon: '🏛️',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    subcategories: [
      {
        id: 'architectural-preservation',
        name: 'Architectural Preservation',
        description: 'Exploring the "why" behind local building styles (e.g., mud-brick, stilt houses)'
      },
      {
        id: 'oral-histories',
        name: 'Oral Histories',
        description: 'Private access to community elders, historians, or "keepers of the keys" for historical sites'
      },
      {
        id: 'curated-expeditions',
        name: 'Curated Expeditions',
        description: 'Deep cultural journeys through historical sites and traditions'
      }
    ]
  },
  {
    id: 'the-soul',
    name: 'The Soul',
    description: 'Spiritual, Wellness & Healing - Ancient wisdom applied to modern burnout',
    icon: '🧘',
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-600',
    subcategories: [
      {
        id: 'rituals-rites',
        name: 'Rituals & Rites',
        description: 'Participation in ceremonies (smoke, water, or chanting) led by local practitioners'
      },
      {
        id: 'ancestral-healing',
        name: 'Ancestral Healing',
        description: 'Traditional herbalism, ancient massage techniques, and forest bathing'
      }
    ]
  },
  {
    id: 'the-unseen',
    name: 'The Unseen',
    description: 'Indigenous & Tribal - Deeply respectful, non-voyeuristic immersion',
    icon: '🌍',
    color: 'teal',
    gradient: 'from-teal-500 to-cyan-600',
    subcategories: [
      {
        id: 'cultural-apprenticeship',
        name: 'Cultural Apprenticeship',
        description: 'Learning a specific skill (weaving, hunting, building) alongside tribal members'
      },
      {
        id: 'remote-lifestyles',
        name: 'Remote Lifestyles',
        description: 'Experiencing life in locations isolated by geography (deserts, high mountains, deep jungles)'
      }
    ]
  },
  {
    id: 'creative-pulse',
    name: 'Creative Pulse',
    description: 'Festivals & Performing Arts - The rhythm of the community',
    icon: '🎭',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    subcategories: [
      {
        id: 'rites-of-celebration',
        name: 'Rites of Celebration',
        description: 'Beyond public festivals—private rehearsals, mask-making, or learning traditional instruments'
      },
      {
        id: 'artisans-studio',
        name: "The Artisan's Studio",
        description: 'Real-time creation with local masters of dance, music, or craft'
      }
    ]
  },
  {
    id: 'water-flow',
    name: 'Water & Flow',
    description: 'Coastal, River & Sea - Life dictated by the tides',
    icon: '🌊',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    subcategories: [
      {
        id: 'ancient-navigation',
        name: 'Ancient Navigation',
        description: 'Using traditional vessels (canoes, dhows, or reed boats) and ancestral stars for navigation'
      },
      {
        id: 'coastal-sustenance',
        name: 'Coastal Sustenance',
        description: 'Traditional fishing methods and the "blue economy" of the locals'
      }
    ]
  },
  {
    id: 'gastronomy',
    name: 'Gastronomy & Ancestral Flavors',
    description: 'Food as the ultimate cultural bridge',
    icon: '🍲',
    color: 'orange',
    gradient: 'from-orange-500 to-red-600',
    subcategories: [
      {
        id: 'foraged-table',
        name: 'The Foraged Table',
        description: 'Gathering wild ingredients and cooking with "Slow Food" techniques'
      },
      {
        id: 'kitchen-secrets',
        name: 'Kitchen Secrets',
        description: 'Multi-generational recipes passed down in family homes, not restaurants'
      }
    ]
  },
  {
    id: 'regional-exclusives',
    name: 'Regional Exclusives',
    description: 'Geography-Specific - "Only Here" experiences',
    icon: '🗺️',
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-600',
    subcategories: [
      {
        id: 'geographic-extremes',
        name: 'Geographic Extremes',
        description: 'Salt flat traditions, high-altitude living, or volcanic geothermal cooking'
      },
      {
        id: 'climate-led-customs',
        name: 'Climate-Led Customs',
        description: 'How people adapt to extreme monsoons, droughts, or snow'
      }
    ]
  }
];

interface CategorySelectorProps {
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onCategoryChange: (category: string | null, subcategory: string | null) => void;
  error?: string;
}

export default function CategorySelector({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  error
}: CategorySelectorProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(selectedCategory || null);

  const handleCategoryClick = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
      onCategoryChange(null, null);
    } else {
      setExpandedCategory(categoryId);
      onCategoryChange(categoryId, null);
    }
  };

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    onCategoryChange(categoryId, subcategoryId);
  };

  const selectedCategoryData = EXPERIENCE_CATEGORIES.find(cat => cat.id === selectedCategory);
  const selectedSubcategoryData = selectedCategoryData?.subcategories.find(
    sub => sub.id === selectedSubcategory
  );

  // Get border color class for selected category
  const getBorderColorClass = (color: string, isSelected: boolean) => {
    if (!isSelected) return 'border-gray-200';
    const colorMap: { [key: string]: string } = {
      green: 'border-green-500',
      amber: 'border-amber-500',
      purple: 'border-purple-500',
      teal: 'border-teal-500',
      pink: 'border-pink-500',
      blue: 'border-blue-500',
      orange: 'border-orange-500',
      indigo: 'border-indigo-500'
    };
    return colorMap[color] || 'border-gray-200';
  };

  return (
    <div className="space-y-4">
      {/* Selected Category Display */}
      {selectedCategory && selectedSubcategory && (
        <div className={`bg-gradient-to-r ${selectedCategoryData?.gradient} rounded-xl p-4 text-white shadow-medium mb-4 animate-fade-in`}>
          <div className="flex items-start gap-3">
            <div className="text-3xl">{selectedCategoryData?.icon}</div>
            <div className="flex-1">
              <div className="font-bold text-lg mb-1">{selectedCategoryData?.name}</div>
              <div className="text-sm opacity-90 mb-2">{selectedSubcategoryData?.name}</div>
              <div className="text-xs opacity-75">{selectedSubcategoryData?.description}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setExpandedCategory(null);
                onCategoryChange(null, null);
              }}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPERIENCE_CATEGORIES.map((category) => {
          const isExpanded = expandedCategory === category.id;
          const isSelected = selectedCategory === category.id;

          return (
            <div
              key={category.id}
              className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                isSelected
                  ? `${getBorderColorClass(category.color, isSelected)} shadow-large bg-gradient-to-br ${category.gradient} text-white`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-medium'
              }`}
            >
              {/* Background Gradient on Hover/Select */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 transition-opacity duration-300 ${
                  isSelected ? 'opacity-100' : 'group-hover:opacity-5'
                }`}
              />

              <div className="relative p-5">
                {/* Category Header */}
                <div
                  onClick={() => handleCategoryClick(category.id)}
                  className="flex items-start gap-4"
                >
                  <div className={`text-4xl transition-transform duration-300 ${isExpanded ? 'scale-110' : ''}`}>
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {category.name}
                    </h3>
                    <p className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                      {category.description}
                    </p>
                  </div>
                  <div className={`flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg
                      className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Subcategories */}
                {isExpanded && (
                  <div className="mt-4 space-y-2 animate-fade-in">
                    {category.subcategories.map((subcategory) => {
                      const isSubSelected = selectedSubcategory === subcategory.id;
                      return (
                        <div
                          key={subcategory.id}
                          onClick={() => handleSubcategoryClick(category.id, subcategory.id)}
                          className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                            isSubSelected
                              ? 'bg-white/20 text-white shadow-medium'
                              : isSelected
                              ? 'bg-white/10 hover:bg-white/15 text-white/90'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="font-semibold text-sm mb-1">{subcategory.name}</div>
                          <div className={`text-xs ${isSubSelected || isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                            {subcategory.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

