'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

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
    gradient: string;
    accentColor: string;
    iconBg: string;
    badge: string;
  }> = [
    {
      id: 'manual',
      title: 'Manual Planning',
      description: 'Full control over your itinerary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      gradient: 'from-blue-600 via-blue-500 to-cyan-500',
      accentColor: 'blue',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      badge: 'Full Control'
    },
    {
      id: 'automatic',
      title: 'AI Pathfinder',
      description: 'AI-powered personalized planning',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      gradient: 'from-purple-600 via-purple-500 to-pink-500',
      accentColor: 'purple',
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      badge: 'AI Powered'
    }
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 text-center"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
          Choose Your Planning Style
        </h3>
        <p className="text-sm text-gray-600">
          Select how you'd like to plan your adventure
        </p>
      </motion.div>

      {/* Button Group */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
        {modes.map((mode, index) => (
          <ModeButton
            key={mode.id}
            mode={mode}
            isSelected={selectedMode === mode.id}
            isHovered={hoveredMode === mode.id}
            onHoverStart={() => setHoveredMode(mode.id)}
            onHoverEnd={() => setHoveredMode(null)}
            onClick={() => onModeChange(mode.id)}
            index={index}
          />
        ))}
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-6 max-w-2xl mx-auto"
      >
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-50 via-white to-gray-50 border border-gray-200 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-accent-500/5" />
          <div className="relative p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedMode === 'manual' 
                    ? 'You\'ll browse all available experiences and add them to your bucketlist before scheduling. Perfect for travelers who want complete control over their itinerary.'
                    : 'Pathfinder will analyze your travel profile and automatically select the best experiences for you, then create an optimized schedule. Ideal for those who prefer a hands-off approach.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface ModeButtonProps {
  mode: {
    id: PlanningMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    accentColor: string;
    iconBg: string;
    badge: string;
  };
  isSelected: boolean;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
  index: number;
}

function ModeButton({ mode, isSelected, isHovered, onHoverStart, onHoverEnd, onClick, index }: ModeButtonProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isHovered) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={(e) => {
        handleMouseLeave();
        onHoverEnd();
      }}
      onMouseEnter={onHoverStart}
      onClick={onClick}
      style={{
        rotateX: isHovered && !isSelected ? rotateX : 0,
        rotateY: isHovered && !isSelected ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className={`
        relative flex-1 group
        px-6 py-5 rounded-2xl
        border-2 transition-all duration-300
        text-left overflow-hidden
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isSelected 
          ? `bg-gradient-to-br ${mode.gradient} text-white shadow-xl ${
              mode.accentColor === 'blue' 
                ? 'border-blue-500 ring-2 ring-blue-500/30 focus:ring-blue-500' 
                : 'border-purple-500 ring-2 ring-purple-500/30 focus:ring-purple-500'
            }` 
          : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:shadow-lg focus:ring-gray-400'
        }
      `}
      whileHover={{ scale: isSelected ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated background gradient for selected state */}
      {isSelected && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${mode.gradient}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Subtle hover gradient overlay */}
      {!isSelected && isHovered && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-[0.03]`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.03 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Glassmorphism overlay for selected state */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 bg-white/10 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center gap-4">
        {/* Icon Container */}
        <motion.div
          className={`
            flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center
            transition-all duration-300 relative
            ${isSelected 
              ? 'bg-white/20 backdrop-blur-md text-white shadow-xl' 
              : `${mode.iconBg} text-white shadow-lg group-hover:shadow-xl`
            }
          `}
          animate={isSelected ? {
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          } : {
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ 
            duration: isSelected ? 2 : 0.3,
            repeat: isSelected ? Infinity : 0,
            repeatDelay: isSelected ? 2 : 0
          }}
        >
          {/* Icon glow effect */}
          {isSelected && (
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-30 blur-md -z-10`}
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          )}
          <div className="relative z-10">
            {mode.icon}
          </div>
        </motion.div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`
              text-lg font-bold tracking-tight
              ${isSelected ? 'text-white' : 'text-gray-900'}
              transition-colors duration-300
            `}>
              {mode.title}
            </h4>
            {mode.badge && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isSelected ? 1 : 0.8,
                  opacity: isSelected ? 1 : 0.7
                }}
                className={`
                  px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider
                  ${isSelected 
                    ? 'bg-white/25 text-white backdrop-blur-sm border border-white/30' 
                    : mode.accentColor === 'blue'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }
                  transition-all duration-300
                `}
              >
                {mode.badge}
              </motion.span>
            )}
          </div>
          <p className={`
            text-sm font-medium
            ${isSelected ? 'text-white/90' : 'text-gray-600'}
            transition-colors duration-300
          `}>
            {mode.description}
          </p>
        </div>

        {/* Selection Indicator */}
        <motion.div
          className="flex-shrink-0"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: isSelected ? 1 : 0,
            opacity: isSelected ? 1 : 0
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 25,
            delay: isSelected ? 0.1 : 0
          }}
        >
          <div className={`
            w-7 h-7 rounded-full flex items-center justify-center
            transition-all duration-300
            ${isSelected 
              ? 'bg-white text-primary-600 shadow-lg' 
              : 'bg-gray-100 text-gray-400'
            }
          `}>
            {isSelected && (
              <motion.svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </motion.svg>
            )}
          </div>
        </motion.div>
      </div>

      {/* Shine effect on hover */}
      {isHovered && !isSelected && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '200%', opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}

      {/* Pulsing glow effect for selected state */}
      {isSelected && (
        <motion.div
          className={`absolute -inset-1 bg-gradient-to-br ${mode.gradient} opacity-20 blur-xl -z-10`}
          animate={{
            opacity: [0.15, 0.25, 0.15],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Ripple effect on click */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-30`}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
