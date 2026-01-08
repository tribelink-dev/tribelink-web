'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Experience {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  location: {
    state: string;
    district: string;
    country: string;
  };
  price: number;
  duration: number;
  imageUrl?: string;
  rating: number;
  ratingCount: number;
  provider?: {
    name: string;
    rating: number;
  };
  isSelected: boolean;
}

export default function GuideExperiencesPage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    district: '',
    category: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'GUIDE') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      fetchExperiences();
      fetchSelectedExperiences();
    }
  }, [router]);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.search) params.search = filters.search;
      if (filters.state) params.state = filters.state;
      if (filters.district) params.district = filters.district;
      if (filters.category) params.category = filters.category;

      const response = await api.get('/hosts/guides/experiences/available', { params });
      setExperiences(response.data.experiences || []);
    } catch (err: any) {
      console.error('Error fetching experiences:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedExperiences = async () => {
    try {
      const response = await api.get('/hosts/guides/experiences');
      const selectedIds = (response.data.servicedExperiences || []).map((exp: any) => exp._id || exp);
      setSelectedExperiences(selectedIds);
    } catch (err: any) {
      console.error('Error fetching selected experiences:', err);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, [filters]);

  const handleToggleExperience = async (experienceId: string) => {
    const isSelected = selectedExperiences.includes(experienceId);
    
    try {
      setSaving(experienceId);
      
      if (isSelected) {
        // Remove
        await api.delete(`/hosts/guides/experiences/${experienceId}`);
        setSelectedExperiences(prev => prev.filter(id => id !== experienceId));
      } else {
        // Add
        await api.post(`/hosts/guides/experiences/${experienceId}`);
        setSelectedExperiences(prev => [...prev, experienceId]);
      }
      
      // Update local state
      setExperiences(prev => prev.map(exp => 
        exp._id === experienceId 
          ? { ...exp, isSelected: !isSelected }
          : exp
      ));
    } catch (err: any) {
      console.error('Error toggling experience:', err);
      alert(err.response?.data?.message || 'Failed to update experience');
    } finally {
      setSaving(null);
    }
  };

  const categories = [
    'Living with the Land',
    'Stories of the Past',
    'The Soul',
    'The Unseen',
    'Creative Pulse',
    'Water & Flow',
    'Gastronomy & Ancestral Flavors',
    'Regional Exclusives'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-xl font-black text-white">Loading Experiences...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 border-b-4 border-emerald-500/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/provider/guides')}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 transition-all"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-4xl font-black text-white mb-2">Select Experiences</h1>
                <p className="text-emerald-200">Choose which experiences you can guide</p>
              </div>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-emerald-400/30">
              <div className="text-sm text-emerald-200">Selected</div>
              <div className="text-2xl font-black text-white">{selectedExperiences.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-emerald-500/30 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-emerald-300 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search experiences..."
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-emerald-300 mb-2">State</label>
              <input
                type="text"
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                placeholder="State"
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-emerald-300 mb-2">District</label>
              <input
                type="text"
                value={filters.district}
                onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                placeholder="District"
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-emerald-300 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Experiences Grid */}
        {experiences.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((experience) => {
              const isSelected = selectedExperiences.includes(experience._id);
              const isSaving = saving === experience._id;

              return (
                <div
                  key={experience._id}
                  className={`group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                    isSelected 
                      ? 'border-emerald-500/50 shadow-2xl shadow-emerald-500/20' 
                      : 'border-slate-700/50 hover:border-emerald-500/30'
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-emerald-600 to-teal-600 overflow-hidden">
                    {experience.imageUrl ? (
                      <img
                        src={experience.imageUrl}
                        alt={experience.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">🗺️</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => handleToggleExperience(experience._id)}
                        disabled={isSaving}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm border-2 transition-all ${
                          isSelected
                            ? 'bg-emerald-500/90 border-emerald-400 text-white'
                            : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-emerald-500/50 hover:border-emerald-400'
                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isSaving ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : isSelected ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {isSelected && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-lg border border-emerald-400">
                        <span className="text-xs font-bold text-white">SELECTED</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-white mb-2 line-clamp-2">
                          {experience.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{experience.location.district}, {experience.location.state}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                      {experience.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">⭐</span>
                          <span className="text-white font-semibold">{experience.rating.toFixed(1)}</span>
                          <span className="text-slate-400 text-sm">({experience.ratingCount})</span>
                        </div>
                        <div className="text-slate-400 text-sm">
                          {experience.duration}h
                        </div>
                      </div>
                      <div className="text-emerald-400 font-bold">
                        ${experience.price}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{experience.category}</span>
                        {experience.provider && (
                          <span className="text-xs text-emerald-300">by {experience.provider.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-emerald-500/30">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🗺️</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">No Experiences Found</h3>
            <p className="text-slate-400 mb-8">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
