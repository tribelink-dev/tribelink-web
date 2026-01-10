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
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  price: number;
  duration: number;
  maxParticipants?: number;
  imageUrl?: string;
  contentUrl?: string;
  rating?: number;
  ratingCount?: number;
  provider?: {
    name: string;
    rating?: number;
    email?: string;
    phoneNumber?: string;
  };
  isSelected: boolean;
  availableDates?: Array<{
    date: string;
    startTime?: string;
    endTime?: string;
    available: boolean;
  }>;
  culturalMetadata?: {
    heritage?: string;
    traditions?: string[];
    culturalSignificance?: string;
    authenticityScore?: number;
    experienceType?: string;
    regionalTags?: string[];
    languageOfExperience?: string[];
    localCommunityInvolvement?: boolean;
    seasonalAvailability?: string[];
  };
  tags?: string[];
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
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [allDistricts, setAllDistricts] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
      fetchAllStatesAndDistricts();
      fetchExperiences();
      fetchSelectedExperiences();
    }
  }, [router]);

  // Fetch all states and districts for dropdowns (without filters)
  const fetchAllStatesAndDistricts = async () => {
    try {
      const response = await api.get('/hosts/guides/experiences/available', { params: {} });
      const allExperiences = response.data.experiences || [];
      
      // Extract unique states and districts from all experiences
      const states = new Set<string>();
      const districts = new Set<string>();
      
      allExperiences.forEach((exp: Experience) => {
        if (exp.location?.state) {
          states.add(exp.location.state);
        }
        if (exp.location?.district) {
          districts.add(exp.location.district);
        }
      });
      
      const sortedStates = Array.from(states).sort();
      const sortedDistricts = Array.from(districts).sort();
      
      setAvailableStates(sortedStates);
      setAvailableDistricts(sortedDistricts);
      setAllDistricts(sortedDistricts); // Store all districts for when no state is selected
    } catch (err: any) {
      console.error('Error fetching states and districts:', err);
    }
  };

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.search) params.search = filters.search;
      if (filters.state) params.state = filters.state;
      if (filters.district) params.district = filters.district;
      if (filters.category) params.category = filters.category;

      const response = await api.get('/hosts/guides/experiences/available', { params });
      const fetchedExperiences = response.data.experiences || [];
      setExperiences(fetchedExperiences);
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

  // Update districts when state changes - filter districts based on selected state
  useEffect(() => {
    if (filters.state) {
      // Fetch all experiences for the selected state to get districts
      const fetchDistrictsForState = async () => {
        try {
          const response = await api.get('/hosts/guides/experiences/available', { 
            params: { state: filters.state } 
          });
          const stateExperiences = response.data.experiences || [];
          
          const stateDistricts = new Set<string>();
          stateExperiences.forEach((exp: Experience) => {
            if (exp.location?.district) {
              stateDistricts.add(exp.location.district);
            }
          });
          
          const sortedDistricts = Array.from(stateDistricts).sort();
          setAvailableDistricts(sortedDistricts);
          
          // Reset district if it's not available in the selected state
          if (filters.district && !sortedDistricts.includes(filters.district)) {
            setFilters(prev => ({ ...prev, district: '' }));
          }
        } catch (err: any) {
          console.error('Error fetching districts for state:', err);
        }
      };
      
      fetchDistrictsForState();
    } else {
      // If no state selected, show all districts from initial load
      setAvailableDistricts(allDistricts);
    }
  }, [filters.state, allDistricts]);

  const handleToggleExperience = async (experienceId: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent opening modal when clicking toggle button
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
      
      // Update modal if open
      if (selectedExperience && selectedExperience._id === experienceId) {
        setSelectedExperience(prev => prev ? { ...prev, isSelected: !isSelected } : null);
      }
    } catch (err: any) {
      console.error('Error toggling experience:', err);
      alert(err.response?.data?.message || 'Failed to update experience');
    } finally {
      setSaving(null);
    }
  };

  const handleViewDetails = async (experienceId: string) => {
    try {
      setLoadingDetails(true);
      const response = await api.get(`/hosts/guides/experiences/${experienceId}`);
      setSelectedExperience(response.data.experience);
      setShowDetailsModal(true);
    } catch (err: any) {
      console.error('Error fetching experience details:', err);
      alert(err.response?.data?.message || 'Failed to load experience details');
    } finally {
      setLoadingDetails(false);
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
              <select
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value, district: '' })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">All States</option>
                {availableStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-emerald-300 mb-2">District</label>
              <select
                value={filters.district}
                onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Districts</option>
                {availableDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
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
                  onClick={() => handleViewDetails(experience._id)}
                  className={`group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
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
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={(e) => handleToggleExperience(experience._id, e)}
                        disabled={isSaving}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm border-2 transition-all z-10 ${
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(experience._id);
                        }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm border-2 bg-blue-500/80 border-blue-400 text-white hover:bg-blue-500 z-10"
                        title="View Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
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
                          <span className="text-white font-semibold">{(experience.rating || 0).toFixed(1)}</span>
                          <span className="text-slate-400 text-sm">({experience.ratingCount || 0})</span>
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

      {/* Experience Details Modal */}
      {showDetailsModal && selectedExperience && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowDetailsModal(false)}
        >
          <div 
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border-2 border-emerald-500/50 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-emerald-500/30 p-6 flex items-center justify-between z-10">
              <h2 className="text-3xl font-black text-white">{selectedExperience.title}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-white transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Image */}
              {selectedExperience.imageUrl && (
                <div className="relative h-64 rounded-xl overflow-hidden">
                  <img
                    src={selectedExperience.imageUrl}
                    alt={selectedExperience.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                  <div className="text-sm text-emerald-300 mb-1">Price</div>
                  <div className="text-2xl font-black text-white">${selectedExperience.price}</div>
                  <div className="text-xs text-slate-400">per person</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                  <div className="text-sm text-emerald-300 mb-1">Duration</div>
                  <div className="text-2xl font-black text-white">{selectedExperience.duration}h</div>
                  <div className="text-xs text-slate-400">experience time</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                  <div className="text-sm text-emerald-300 mb-1">Rating</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white">{(selectedExperience.rating || 0).toFixed(1)}</span>
                    <span className="text-yellow-400">⭐</span>
                  </div>
                  <div className="text-xs text-slate-400">{selectedExperience.ratingCount || 0} reviews</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Description</h3>
                <p className="text-slate-300 leading-relaxed">{selectedExperience.description}</p>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Location</h3>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                  <div className="flex items-center gap-2 text-slate-300">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-semibold">{selectedExperience.location.district}, {selectedExperience.location.state}, {selectedExperience.location.country}</span>
                  </div>
                </div>
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Category</h3>
                  <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg px-4 py-2 text-emerald-300 font-semibold">
                    {selectedExperience.category}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Subcategory</h3>
                  <div className="bg-slate-700/30 border border-slate-600 rounded-lg px-4 py-2 text-slate-300 font-semibold">
                    {selectedExperience.subcategory}
                  </div>
                </div>
              </div>

              {/* Max Participants */}
              {selectedExperience.maxParticipants && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Maximum Participants</h3>
                  <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600 text-slate-300">
                    Up to {selectedExperience.maxParticipants} people
                  </div>
                </div>
              )}

              {/* Cultural Metadata */}
              {selectedExperience.culturalMetadata && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Cultural Information</h3>
                  <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600 space-y-3">
                    {selectedExperience.culturalMetadata.heritage && (
                      <div>
                        <span className="text-emerald-300 font-semibold">Heritage: </span>
                        <span className="text-slate-300">{selectedExperience.culturalMetadata.heritage}</span>
                      </div>
                    )}
                    {selectedExperience.culturalMetadata.experienceType && (
                      <div>
                        <span className="text-emerald-300 font-semibold">Type: </span>
                        <span className="text-slate-300">{selectedExperience.culturalMetadata.experienceType}</span>
                      </div>
                    )}
                    {selectedExperience.culturalMetadata.culturalSignificance && (
                      <div>
                        <span className="text-emerald-300 font-semibold">Significance: </span>
                        <span className="text-slate-300">{selectedExperience.culturalMetadata.culturalSignificance}</span>
                      </div>
                    )}
                    {selectedExperience.culturalMetadata.traditions && selectedExperience.culturalMetadata.traditions.length > 0 && (
                      <div>
                        <span className="text-emerald-300 font-semibold">Traditions: </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedExperience.culturalMetadata.traditions.map((tradition, idx) => (
                            <span key={idx} className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg px-3 py-1 text-sm text-emerald-300">
                              {tradition}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedExperience.culturalMetadata.regionalTags && selectedExperience.culturalMetadata.regionalTags.length > 0 && (
                      <div>
                        <span className="text-emerald-300 font-semibold">Regional Tags: </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedExperience.culturalMetadata.regionalTags.map((tag, idx) => (
                            <span key={idx} className="bg-blue-500/20 border border-blue-500/50 rounded-lg px-3 py-1 text-sm text-blue-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedExperience.culturalMetadata.authenticityScore !== undefined && (
                      <div>
                        <span className="text-emerald-300 font-semibold">Authenticity Score: </span>
                        <span className="text-slate-300">{selectedExperience.culturalMetadata.authenticityScore}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedExperience.tags && selectedExperience.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExperience.tags.map((tag, idx) => (
                      <span key={idx} className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1 text-sm text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Provider Info */}
              {selectedExperience.provider && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Experience Host</h3>
                  <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold">{selectedExperience.provider.name}</div>
                        {selectedExperience.provider.rating !== undefined && (
                          <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                            <span className="text-yellow-400">⭐</span>
                            <span>{(selectedExperience.provider.rating || 0).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Available Dates */}
              {selectedExperience.availableDates && selectedExperience.availableDates.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Available Dates</h3>
                  <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {selectedExperience.availableDates.slice(0, 20).map((dateSlot, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded-lg p-2 text-center border border-slate-600">
                          <div className="text-xs text-slate-400 mb-1">{format(new Date(dateSlot.date), 'MMM dd, yyyy')}</div>
                          {dateSlot.startTime && dateSlot.endTime && (
                            <div className="text-xs text-emerald-300">{dateSlot.startTime} - {dateSlot.endTime}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    {selectedExperience.availableDates.length > 20 && (
                      <div className="text-sm text-slate-400 mt-2 text-center">
                        +{selectedExperience.availableDates.length - 20} more dates
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    handleToggleExperience(selectedExperience._id);
                    if (!selectedExperience.isSelected) {
                      setSelectedExperience({ ...selectedExperience, isSelected: true });
                    }
                  }}
                  disabled={selectedExperience.isSelected || saving === selectedExperience._id}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    selectedExperience.isSelected
                      ? 'bg-emerald-500/50 border-2 border-emerald-500 text-emerald-300 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-emerald-400'
                  }`}
                >
                  {selectedExperience.isSelected ? 'Already Selected' : 'Select This Experience'}
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-3 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-600 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
