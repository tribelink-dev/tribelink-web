'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export type PricingMode = 'daily' | 'hourly';

interface GuidePricingSelectorProps {
  selectedMode: PricingMode;
  onModeChange: (mode: PricingMode) => void;
  guideHourlyRate?: number;
  estimatedHours?: number;
  dailyRate?: number;
  className?: string;
}

export default function GuidePricingSelector({
  selectedMode,
  onModeChange,
  guideHourlyRate = 15,
  estimatedHours = 4,
  dailyRate = 50,
  className = ''
}: GuidePricingSelectorProps) {
  const dailyCost = dailyRate;
  const hourlyCost = guideHourlyRate * estimatedHours;

  return (
    <div className={`bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Guide Pricing Mode</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Daily Pricing Option */}
        <motion.div
          onClick={() => onModeChange('daily')}
          className={`
            relative cursor-pointer rounded-lg p-4 border-2 transition-all
            ${selectedMode === 'daily'
              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
              : 'border-gray-200 hover:border-primary-300'
            }
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selectedMode === 'daily' ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}
              `}>
                {selectedMode === 'daily' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                )}
              </div>
              <span className="font-semibold text-gray-900">Daily Rate</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-primary-600 mb-1">${dailyCost}/day</p>
          <p className="text-xs text-gray-600">Fixed rate per day</p>
        </motion.div>

        {/* Hourly Pricing Option */}
        <motion.div
          onClick={() => onModeChange('hourly')}
          className={`
            relative cursor-pointer rounded-lg p-4 border-2 transition-all
            ${selectedMode === 'hourly'
              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
              : 'border-gray-200 hover:border-primary-300'
            }
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selectedMode === 'hourly' ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}
              `}>
                {selectedMode === 'hourly' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                )}
              </div>
              <span className="font-semibold text-gray-900">Hourly Rate</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-primary-600 mb-1">
            ${guideHourlyRate}/hr
          </p>
          <p className="text-xs text-gray-600">
            ~{estimatedHours} hrs/day = ${hourlyCost.toFixed(0)}/day
          </p>
        </motion.div>
      </div>

      {/* Cost Comparison */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Estimated Daily Cost:</span>
          <span className="text-lg font-bold text-gray-900">
            {selectedMode === 'daily' ? `$${dailyCost}` : `$${hourlyCost.toFixed(0)}`}
          </span>
        </div>
        {selectedMode === 'hourly' && (
          <div className="mt-2 text-xs text-gray-600">
            Based on {estimatedHours} hours/day × ${guideHourlyRate}/hr
          </div>
        )}
      </div>
    </div>
  );
}

