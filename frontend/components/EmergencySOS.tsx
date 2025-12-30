'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import SOSModal from './SOSModal';

export default function EmergencySOS() {
  const { user } = useAuth();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isExpanded) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Don't show SOS button if user is not logged in
  if (!user) {
    return null;
  }

  const handleActivateSOS = () => {
    setIsExpanded(false);
    setShowModal(true);
  };

  const handleSafetySettings = () => {
    setIsExpanded(false);
    router.push('/dashboard/safety');
  };

  return (
    <>
      <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
        {/* Expanded Menu Circles */}
        {isExpanded && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
              onClick={() => setIsExpanded(false)}
            />
            
            {/* Activate SOS Circle - Top Left */}
            <div
              className={`absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full shadow-2xl flex items-center justify-center cursor-pointer z-50 ${
                isExpanded ? 'sos-menu-item-expanded-top' : 'sos-menu-item-collapsed'
              }`}
              onClick={handleActivateSOS}
            >
              <div className="text-center text-white">
                <svg className="w-8 h-8 mx-auto mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xs font-bold">Activate</span>
              </div>
            </div>

            {/* Safety Settings Circle - Top Right */}
            <div
              className={`absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-2xl flex items-center justify-center cursor-pointer z-50 ${
                isExpanded ? 'sos-menu-item-expanded-bottom' : 'sos-menu-item-collapsed'
              }`}
              onClick={handleSafetySettings}
            >
              <div className="text-center text-white">
                <svg className="w-8 h-8 mx-auto mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs font-bold">Settings</span>
              </div>
            </div>
          </>
        )}

        {/* Main SOS Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative group z-50"
          aria-label="Emergency SOS"
          title="Emergency SOS - Tap for options"
        >
          <div className="relative">
            {/* Pulsing ring animations - only when not expanded */}
            {!isExpanded && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
              </>
            )}
            
            {/* Main button */}
            <div className={`relative w-20 h-20 bg-gradient-to-br from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white rounded-full shadow-2xl shadow-red-500/50 flex items-center justify-center font-bold text-sm transition-all duration-300 transform hover:scale-110 active:scale-95 border-2 border-white/20 ${isExpanded ? 'rotate-45' : ''}`}>
              <div className="flex flex-col items-center relative z-10">
                {isExpanded ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <>
                    <svg 
                      className="w-8 h-8 mb-0.5 drop-shadow-lg" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2.5} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                      />
                    </svg>
                    <span className="text-xs font-bold tracking-wider">SOS</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </button>
      </div>

      {showModal && (
        <SOSModal
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

