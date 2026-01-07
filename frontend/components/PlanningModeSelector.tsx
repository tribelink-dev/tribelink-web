'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type PlanningMode = 'manual' | 'automatic';

interface PlanningModeSelectorProps {
  selectedMode: PlanningMode;
  onModeChange: (mode: PlanningMode) => void;
  className?: string;
}

export default function PlanningModeSelector({
  selectedMode,
  onModeChange,
  className = ''
}: PlanningModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<PlanningMode | null>(null);

  const modes: Array<{
    id: PlanningMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    gradient: string;
    iconBg: string;
  }> = [
    {
      id: 'manual',
      title: 'Manual Planning',
      description: 'Take full control and curate your perfect itinerary',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      features: ['Browse all experiences', 'Select your favorites', 'Customize your schedule'],
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500'
    },
    {
      id: 'automatic',
      title: 'AI Pathfinder',
      description: 'Let our AI curate personalized experiences just for you',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      features: ['AI-powered selection', 'Personalized to your profile', 'Automatic scheduling'],
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500'
    }
  ];

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Planning Style</h3>
        <p className="text-gray-600">Select how you'd like to plan your adventure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const isHovered = hoveredMode === mode.id;

          return (
            <motion.div
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              onHoverStart={() => setHoveredMode(mode.id)}
              onHoverEnd={() => setHoveredMode(null)}
              className={`
                relative cursor-pointer rounded-2xl overflow-hidden
                transition-all duration-300
                ${isSelected 
                  ? 'ring-4 ring-primary-500 ring-offset-2 shadow-2xl scale-[1.02]' 
                  : 'shadow-lg hover:shadow-xl'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Gradient */}
              <div className={`
                absolute inset-0 bg-gradient-to-br ${mode.gradient} 
                ${isSelected ? 'opacity-100' : 'opacity-0'}
                transition-opacity duration-300
              `} />

              {/* Content */}
              <div className={`
                relative p-8 bg-white
                ${isSelected ? 'bg-opacity-95' : ''}
                transition-all duration-300
              `}>
                {/* Icon */}
                <div className={`
                  w-16 h-16 rounded-2xl ${mode.iconBg} 
                  flex items-center justify-center text-white mb-6
                  shadow-lg transform transition-transform duration-300
                  ${isSelected ? 'scale-110 rotate-6' : ''}
                `}>
                  {mode.icon}
                </div>

                {/* Title */}
                <h4 className={`
                  text-2xl font-bold mb-2
                  ${isSelected ? 'text-white' : 'text-gray-900'}
                  transition-colors duration-300
                `}>
                  {mode.title}
                </h4>

                {/* Description */}
                <p className={`
                  text-sm mb-6
                  ${isSelected ? 'text-white/90' : 'text-gray-600'}
                  transition-colors duration-300
                `}>
                  {mode.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {mode.features.map((feature, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: isSelected ? 1 : 0.8,
                        x: 0
                      }}
                      transition={{ delay: idx * 0.1 }}
                      className={`
                        flex items-center gap-2 text-sm
                        ${isSelected ? 'text-white' : 'text-gray-700'}
                        transition-colors duration-300
                      `}
                    >
                      <motion.div
                        animate={{ 
                          scale: isSelected ? [1, 1.2, 1] : 1,
                          rotate: isSelected ? [0, 10, 0] : 0
                        }}
                        transition={{ 
                          delay: idx * 0.1,
                          duration: 0.3
                        }}
                        className={`
                          w-5 h-5 rounded-full flex items-center justify-center
                          ${isSelected ? 'bg-white/30' : 'bg-primary-100'}
                          transition-colors duration-300
                        `}
                      >
                        <svg className="w-3 h-3 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* Selection Indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-6 pt-6 border-t border-white/20"
                    >
                      <div className="flex items-center justify-center gap-2 text-white font-semibold">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Selected</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={isHovered ? { x: '200%' } : { x: '-100%' }}
                transition={{ duration: 0.6 }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4 border-2 border-primary-200"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700 font-medium">
              {selectedMode === 'manual' 
                ? 'You\'ll browse all available experiences and add them to your bucketlist before scheduling.'
                : 'Pathfinder will analyze your travel profile and automatically select the best experiences for you, then create an optimized schedule.'
              }
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

