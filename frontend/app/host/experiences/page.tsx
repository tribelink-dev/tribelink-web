'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Experience {
  _id: string;
  title: string;
  description: string;
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

  useEffect(() => {
    // Check if user is logged in as host
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
      const response = await api.get('/hosts/experiences');
      setExperiences(response.data.experiences || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load experiences');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${imageUrl}`;
  };

  const handleDelete = async (experienceId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(experienceId);
      await api.delete(`/hosts/experience/${experienceId}`);
      
      // Remove from local state
      setExperiences(experiences.filter(exp => exp._id !== experienceId));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete experience');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading your experiences...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-secondary text-gray-900 mb-2">
              My Experiences
            </h1>
            <p className="text-gray-600">
              Manage and view all your listed experiences
            </p>
          </div>
          <button
            onClick={() => router.push('/host/experiences/add')}
            className="btn-primary"
          >
            + Add New Experience
          </button>
        </div>

        {error && (
          <div className="alert-error mb-6">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {experiences.length === 0 ? (
          <div className="content-card text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-xl text-gray-700 mb-2 font-semibold">No experiences yet</p>
            <p className="text-gray-500 mb-6">Start by creating your first experience</p>
            <button
              onClick={() => router.push('/host/experiences/add')}
              className="btn-primary"
            >
              Create Your First Experience
            </button>
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
                    
                    <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📍</span>
                        <span>{experience.location.district}, {experience.location.state}</span>
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
                        <span>Max {experience.maxParticipants} participants</span>
                      </div>
                      {(experience.averageRating > 0 || experience.reviewCount > 0) && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="badge-rating">
                            <span>⭐</span>
                            {experience.averageRating > 0 ? experience.averageRating.toFixed(1) : 'N/A'}
                            {experience.reviewCount > 0 && (
                              <span className="ml-1 text-xs">({experience.reviewCount} reviews)</span>
                            )}
                          </div>
                        </div>
                      )}
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
                        onClick={() => handleDelete(experience._id, experience.title)}
                        disabled={deletingId === experience._id}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === experience._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

