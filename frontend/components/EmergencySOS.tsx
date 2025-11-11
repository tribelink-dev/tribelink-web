'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import SOSModal from './SOSModal';

export default function EmergencySOS() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  // Don't show SOS button if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-50 w-20 h-20 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 transform hover:scale-110 active:scale-95"
        aria-label="Emergency SOS"
        title="Emergency SOS - Tap for help"
      >
        <div className="flex flex-col items-center">
          <span className="text-2xl mb-0.5">🚨</span>
          <span className="text-xs font-bold">SOS</span>
        </div>
      </button>

      {showModal && (
        <SOSModal
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

