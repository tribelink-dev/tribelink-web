'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Review {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface Experience {
  _id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  contentUrl?: string;
  averageRating: number;
  reviewCount: number;
  provider: {
    name: string;
    rating: number;
  };
  recentReviews?: Review[];
  location?: { state: string; district: string }; // Added location info
}

export default function ExperiencesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [bucketlist, setBucketlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasNoTokens, setHasNoTokens] = useState(false);

  const country = searchParams.get('country') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  
  // Parse multiple locations from query params (memoized to prevent infinite loop)
  const locations = useMemo(() => {
    const locs: Array<{ state: string; district: string }> = [];
    let idx = 0;
    while (searchParams.get(`state${idx}`) && searchParams.get(`district${idx}`)) {
      locs.push({
        state: searchParams.get(`state${idx}`) || '',
        district: searchParams.get(`district${idx}`) || ''
      });
      idx++;
    }

    // Fallback to single location if multiple locations not found
    if (locs.length === 0 && searchParams.get('state') && searchParams.get('district')) {
      locs.push({
        state: searchParams.get('state') || '',
        district: searchParams.get('district') || ''
      });
    }
    return locs;
  }, [searchParams]);

  // Create a stable key for locations to use in useEffect
  const locationsKey = useMemo(() => 
    locations.map(l => `${l.state}-${l.district}`).join('|'),
    [locations]
  );

  useEffect(() => {
    if (locations.length > 0) {
      fetchExperiences();
    }
    fetchBucketlist();
    
    // Check tokens when component loads
    const checkTokens = async () => {
      try {
        const response = await api.get('/user/me');
        if (response.data.user) {
          const tokens = response.data.user.tokens || 0;
          setHasNoTokens(tokens === 0);
          
          // Update user in localStorage
          if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              userData.tokens = tokens;
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }
        }
      } catch (err) {
        // If check fails, allow proceed (will be caught at schedule time)
        setHasNoTokens(false);
      }
    };
    
    if (user) {
      checkTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationsKey, country, user]); // Use stable key instead of array

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (locations.length === 0) {
        setError('Please select at least one location');
        setLoading(false);
        return;
      }
      
      // Fetch experiences from all locations
      const experiencePromises = locations.map(loc =>
        api.get('/trips/experiences/' + encodeURIComponent(loc.district), {
          params: { country, state: loc.state }
        })
      );
      
      const responses = await Promise.all(experiencePromises);
      const allExperiences = responses.flatMap((response, idx) => 
        (response.data.experiences || []).map((exp: Experience) => ({
          ...exp,
          location: locations[idx] // Add location info to each experience
        }))
      );
      
      // Remove duplicates based on experience ID
      const uniqueExperiences = allExperiences.filter((exp, index, self) =>
        index === self.findIndex(e => e._id === exp._id)
      );
      
      setExperiences(uniqueExperiences);
    } catch (err: any) {
      console.error('Error fetching experiences:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to load experiences';
      setError(errorMessage);
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBucketlist = async () => {
    try {
      const response = await api.get('/user/bucketlist');
      // Handle both populated and non-populated responses
      const bucketlistIds = response.data.bucketlist?.map((e: any) => {
        // If populated, use _id, otherwise use the ID directly
        return e._id ? e._id.toString() : e.toString();
      }) || [];
      setBucketlist(bucketlistIds);
    } catch (err: any) {
      console.error('Error fetching bucketlist:', err);
      // Bucketlist might be empty or error occurred
      setBucketlist([]);
    }
  };

  const toggleBucketlist = async (experienceId: string) => {
    try {
      setError(''); // Clear any previous errors
      const experienceIdStr = experienceId.toString();
      
      if (bucketlist.includes(experienceIdStr)) {
        const response = await api.delete(`/user/bucketlist/${experienceIdStr}`);
        // Update bucketlist from response or filter locally
        if (response.data.bucketlist) {
          setBucketlist(response.data.bucketlist);
        } else {
          setBucketlist(bucketlist.filter(id => id.toString() !== experienceIdStr));
        }
      } else {
        const response = await api.post('/user/bucketlist', { experienceId: experienceIdStr });
        // Update bucketlist from response or add locally
        if (response.data.bucketlist) {
          setBucketlist(response.data.bucketlist);
        } else {
          setBucketlist([...bucketlist, experienceIdStr]);
        }
      }
    } catch (err: any) {
      console.error('Bucketlist error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update bucketlist';
      setError(errorMessage);
      // Refresh bucketlist on error
      fetchBucketlist();
    }
  };

  const handleProceed = () => {
    if (bucketlist.length === 0) {
      setError('Please add at least one experience to your bucketlist');
      return;
    }
    
    // Check if user has tokens
    if (hasNoTokens || (user && (!user.tokens || user.tokens === 0))) {
      setError('You need at least 1 token to schedule a trip. Complete an existing trip payment to earn more tokens!');
      return;
    }
    
    router.push('/trips/schedule');
  };

  const handleOpenReview = (experience: Experience) => {
    setSelectedExperience(experience);
    setShowReviewModal(true);
  };

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${imageUrl}`;
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading experiences...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-7xl">
        {/* Token Warning - Show prominently if no tokens */}
        {hasNoTokens || (user && (!user.tokens || user.tokens === 0)) ? (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🪙</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">
                  No Tokens Available
                </h3>
                <p className="text-yellow-800 mb-4">
                  You need at least 1 token to schedule a trip. Complete an existing trip payment to earn 2 tokens and continue planning your adventures!
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-primary"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {error && (
          <div className="alert-error mb-6">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        <div className="content-card mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="heading-secondary text-gray-900 mb-2">
                {locations.length === 1 
                  ? `Experiences in ${locations[0].district}`
                  : `Experiences across ${locations.length} destinations`}
              </h1>
              <p className="text-gray-600 flex items-center gap-2 flex-wrap">
                <span>📍</span> 
                {locations.length === 1 
                  ? `${country}, ${locations[0].state}`
                  : locations.map(loc => `${loc.district}, ${loc.state}`).join(' • ')}
              </p>
            </div>
            <button
              onClick={handleProceed}
              disabled={bucketlist.length === 0 || hasNoTokens || (user ? (!user.tokens || user.tokens === 0) : false)}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {bucketlist.length > 0 ? `Proceed with ${bucketlist.length} item${bucketlist.length !== 1 ? 's' : ''}` : 'Add items to continue'}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert-error mb-6">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {experiences.length === 0 ? (
          <div className="content-card text-center py-16">
            <div className="text-6xl mb-4">🌴</div>
            <p className="text-xl text-gray-700 mb-2 font-semibold">No experiences available yet</p>
            <p className="text-gray-500">Check back later or try a different location</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((experience) => {
              const imageUrl = getImageUrl(experience.imageUrl);
              return (
                <div key={experience._id} className="card-professional card-hover overflow-hidden">
                  {imageUrl ? (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={experience.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : experience.contentUrl ? (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                      <video className="w-full h-full object-cover" controls>
                        <source src={experience.contentUrl} />
                        Your browser does not support video.
                      </video>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-primary flex items-center justify-center">
                      <span className="text-6xl">🎬</span>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{experience.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">{experience.description}</p>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{experience.provider.name}</p>
                        <div className="flex items-center gap-2">
                          {experience.averageRating > 0 && (
                            <div className="badge-rating">
                              <span>⭐</span>
                              {experience.averageRating.toFixed(1)}
                              {experience.reviewCount > 0 && (
                                <span className="ml-1 text-xs">({experience.reviewCount})</span>
                              )}
                            </div>
                          )}
                          <div className="badge-rating bg-primary-50 text-primary-700">
                            <span>👤</span>
                            {experience.provider.rating.toFixed(1)} Host
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">
                          ${experience.price}
                        </p>
                        <p className="text-xs text-gray-500">per person</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleBucketlist(experience._id)}
                        className={`w-full py-3 rounded-xl font-semibold transition-all ${
                          bucketlist.includes(experience._id.toString())
                            ? 'bg-red-500 text-white hover:bg-red-600 shadow-medium'
                            : 'btn-primary'
                        }`}
                      >
                        {bucketlist.includes(experience._id.toString()) ? 'Remove from Bucketlist' : 'Add to Bucketlist'}
                      </button>
                      <button
                        onClick={() => handleOpenReview(experience)}
                        className="w-full btn-secondary py-2 text-sm"
                      >
                        {experience.reviewCount > 0 ? 'View Reviews' : 'Be the first to review'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showReviewModal && selectedExperience && (
        <ReviewModal
          experience={selectedExperience}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedExperience(null);
          }}
          onReviewAdded={() => {
            fetchExperiences();
          }}
        />
      )}
    </div>
  );
}

// Review Modal Component
function ReviewModal({ 
  experience, 
  onClose, 
  onReviewAdded 
}: { 
  experience: Experience; 
  onClose: () => void;
  onReviewAdded: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<Review[]>(experience.recentReviews || []);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [experience._id]);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await api.get(`/experiences/${experience._id}`);
      setReviews(response.data.reviews || []);
    } catch (err) {
      // Handle error silently
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post(`/experiences/${experience._id}`, {
        rating,
        comment: comment.trim()
      });

      setComment('');
      setRating(5);
      setShowReviewForm(false);
      await fetchReviews();
      onReviewAdded();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="heading-secondary mb-0">Reviews for {experience.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {showReviewForm ? (
            <form onSubmit={handleSubmitReview} className="mb-6">
              {error && (
                <div className="alert-error mb-4">
                  <span className="text-lg">⚠️</span>
                  <span className="flex-1">{error}</span>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-all ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Share your experience..."
                  className="input-field"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowReviewForm(true)}
              className="btn-primary w-full mb-6"
            >
              Write a Review
            </button>
          )}

          {loadingReviews ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">No reviews yet</p>
              <p className="text-sm">Be the first to review this experience!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{review.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

