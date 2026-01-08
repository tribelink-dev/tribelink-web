'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import HostSidebar from '@/components/HostSidebar';
import ToastContainer, { useToast } from '@/components/Toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { SkeletonCard } from '@/components/SkeletonLoader';

interface Experience {
  _id: string;
  title: string;
  description: string;
  category?: string;
  subcategory?: string;
  price: number;
  duration: number;
  maxParticipants: number;
  imageUrl?: string;
  contentUrl?: string;
  averageRating: number;
  reviewCount: number;
  location: {
    country: string;
    state: string;
    district: string;
  };
  availableDates: string[];
  createdAt: string;
}

export default function HostExperiencesPage() {
  const router = useRouter();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; experience: Experience | null }>({
    isOpen: false,
    experience: null
  });
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-high' | 'price-low' | 'rating'>('newest');
  
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!host || !token) {
        router.push('/host/login');
        return;
      }
    }
    fetchExperiences();
  }, [router]);

  const fetchExperiences = async () => {
    try {
      setError('');
      const response = await api.get('/hosts/experiences');
      setExperiences(response.data.experiences || []);
      toast.success('Experiences loaded successfully');
    } catch (err: any) {
      console.error('[Host Experiences] Error:', err);
      let errorMessage = 'Failed to load experiences';
      
      if (err.response?.data) {
        errorMessage = err.response.data.message || err.response.data.error || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (!err.response) {
        errorMessage += ' (Network error - check if backend is running)';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted experiences
  const filteredExperiences = useMemo(() => {
    let filtered = [...experiences];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exp =>
        exp.title.toLowerCase().includes(query) ||
        exp.description.toLowerCase().includes(query) ||
        exp.location.district.toLowerCase().includes(query) ||
        exp.location.state.toLowerCase().includes(query)
      );
    }

    // State filter
    if (filterState) {
      filtered = filtered.filter(exp => exp.location.state === filterState);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price-high':
          return b.price - a.price;
        case 'price-low':
          return a.price - b.price;
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [experiences, searchQuery, filterState, sortBy]);

  // Get unique states for filter
  const uniqueStates = useMemo(() => {
    const states = new Set(experiences.map(exp => exp.location.state));
    return Array.from(states).sort();
  }, [experiences]);

  const handleDelete = async () => {
    if (!deleteModal.experience) return;

    try {
      setDeletingId(deleteModal.experience._id);
      await api.delete(`/hosts/experience/${deleteModal.experience._id}`);
      
      setExperiences(experiences.filter(exp => exp._id !== deleteModal.experience!._id));
      setDeleteModal({ isOpen: false, experience: null });
      toast.success(`"${deleteModal.experience.title}" deleted successfully`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete experience');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HostSidebar />
        <div className="lg:ml-72 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HostSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  My Experiences
                </h1>
                <p className="text-gray-600">
                  Manage and view all your listed experiences ({experiences.length} total)
                </p>
              </div>
              <button
                onClick={() => router.push('/host/experiences/add')}
                className="btn-primary flex items-center gap-2 px-6 py-3"
              >
                <span className="text-xl">+</span>
                <span>Add New Experience</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search experiences..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* State Filter */}
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All States</option>
                  {uniqueStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              {/* Active filters */}
              {(searchQuery || filterState) && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      Search: "{searchQuery}"
                      <button onClick={() => setSearchQuery('')} className="hover:text-primary-900">×</button>
                    </span>
                  )}
                  {filterState && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      State: {filterState}
                      <button onClick={() => setFilterState('')} className="hover:text-blue-900">×</button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {filteredExperiences.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-200">
              <div className="text-6xl mb-4">
                {experiences.length === 0 ? '🎯' : '🔍'}
              </div>
              <p className="text-xl text-gray-700 mb-2 font-semibold">
                {experiences.length === 0 ? 'No experiences yet' : 'No experiences match your filters'}
              </p>
              <p className="text-gray-500 mb-6">
                {experiences.length === 0
                  ? 'Start by creating your first experience'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {experiences.length === 0 && (
                <button
                  onClick={() => router.push('/host/experiences/add')}
                  className="btn-primary"
                >
                  Create Your First Experience
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredExperiences.length} of {experiences.length} experiences
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExperiences.map((experience) => {
                  const imageUrl = getImageUrl(experience.imageUrl ?? undefined);
                  return (
                    <div key={experience._id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                      {imageUrl ? (
                        <div className="w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden relative group">
                          <img 
                            src={imageUrl} 
                            alt={experience.title}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full aspect-video bg-gradient-primary flex items-center justify-center"><span class="text-6xl">🎬</span></div>';
                              }
                            }}
                          />
                          <div className="absolute top-3 right-3">
                            {experience.averageRating > 0 && (
                              <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-semibold text-gray-900">
                                ⭐ {experience.averageRating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full aspect-video bg-gradient-primary flex items-center justify-center">
                          <span className="text-6xl">🎬</span>
                        </div>
                      )}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold mb-2 text-gray-900 line-clamp-1">{experience.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{experience.description}</p>
                        
                        {(experience.category || experience.subcategory) && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {experience.category && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200">
                                {experience.category}
                              </span>
                            )}
                            {experience.subcategory && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                {experience.subcategory}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>📍</span>
                            <span className="truncate">{experience.location.district}, {experience.location.state}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>💰</span>
                            <span className="font-semibold text-primary-600">${experience.price}</span>
                            <span className="text-gray-500">per person</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>⏱️</span>
                            <span>{experience.duration} hours</span>
                            <span className="text-gray-400">•</span>
                            <span>Max {experience.maxParticipants}</span>
                          </div>
                          {experience.availableDates.length > 0 && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <span>📅</span>
                              <div className="flex-1">
                                <span className="font-semibold">{experience.availableDates.length}</span> available date{experience.availableDates.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/host/experiences/edit/${experience._id}`)}
                            className="btn-secondary flex-1 text-sm py-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, experience })}
                            disabled={deletingId === experience._id}
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, experience: null })}
        onConfirm={handleDelete}
        title="Delete Experience"
        message={`Are you sure you want to delete "${deleteModal.experience?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deletingId !== null}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
