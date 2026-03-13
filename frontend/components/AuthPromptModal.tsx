'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Heart, Calendar } from 'lucide-react';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  message: string;
  actionType?: 'save' | 'book' | 'view';
  /** After login/signup redirect here (e.g. /trips/select). Defaults to /explore. */
  returnTo?: string;
}

export default function AuthPromptModal({
  isOpen,
  onClose,
  onSignIn,
  onSignUp,
  message,
  actionType = 'save',
  returnTo = '/explore'
}: AuthPromptModalProps) {
  const router = useRouter();
  const redirect = returnTo ? encodeURIComponent(returnTo) : '';

  const handleSignIn = () => {
    router.push(redirect ? `/login?returnTo=${redirect}` : '/login');
    onSignIn();
  };

  const handleSignUp = () => {
    router.push(redirect ? `/signup?returnTo=${redirect}` : '/signup');
    onSignUp();
  };

  const getIcon = () => {
    switch (actionType) {
      case 'save':
        return <Heart className="w-8 h-8 text-heritage-gold" />;
      case 'book':
        return <Calendar className="w-8 h-8 text-heritage-gold" />;
      case 'view':
        return <Lock className="w-8 h-8 text-heritage-gold" />;
      default:
        return <Sparkles className="w-8 h-8 text-heritage-gold" />;
    }
  };

  const getBenefitMessage = () => {
    switch (actionType) {
      case 'save':
        return 'Sign in to save your favorite experiences and access them anytime';
      case 'book':
        return 'Sign in to book experiences and create unforgettable memories';
      case 'view':
        return 'Sign in to view detailed information and personalized recommendations';
      default:
        return 'Sign in to unlock all features and personalize your experience';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-heritage-gold/10 via-cream-50/80 to-heritage-gold-light/5 p-8 text-center border-b border-heritage-gold/20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-heritage-gold to-heritage-gold-dark flex items-center justify-center shadow-lg mx-auto mb-4"
                >
                  {getIcon()}
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {message}
                </h2>
                <p className="text-gray-600 text-sm">
                  {getBenefitMessage()}
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleSignUp}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold text-white font-semibold rounded-xl hover:from-heritage-gold-dark hover:to-heritage-gold-dark transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={handleSignIn}
                    className="w-full px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all"
                  >
                    Sign In
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="w-full mt-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

