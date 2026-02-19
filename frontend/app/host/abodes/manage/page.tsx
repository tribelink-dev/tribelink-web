'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AbodeSidebar from '@/components/AbodeSidebar';
import ToastContainer, { useToast } from '@/components/Toast';
import { getImageUrl } from '@/lib/imageUtils';
import { motion } from 'framer-motion';

interface Abode {
  _id: string;
  abodeDetails: {
    title?: string;
    description: string;
    capacity: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    houseRules: string[];
    propertyType: string;
  };
  location: {
    country: string;
    state: string;
    district: string;
    address?: string;
  };
  pricing: {
    pricePerNight: number;
    currency: string;
  };
  images: Array<{
    url: string;
    isMain: boolean;
    caption?: string;
  }>;
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  isArchived?: boolean;
}

export default function ManageAbodePage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [abodes, setAbodes] = useState<Abode[]>([]);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      // Any host can now manage abodes, regardless of provider type

      setHost(parsedHost);
      fetchAbodes();
    }
  }, [router]);

  const fetchAbodes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/abodes/owner/my-abodes');
      setAbodes(response.data.abodes || []);
    } catch (err: any) {
      console.error('Error fetching abodes:', err);
      setError(err.response?.data?.message || 'Failed to load abodes');
      toast.error('Failed to load abodes');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/abodes/${id}/archive`);
      toast.success(currentStatus ? 'Abode unarchived successfully' : 'Abode archived successfully');
      fetchAbodes();
    } catch (err: any) {
      console.error('Error archiving abode:', err);
      toast.error(err.response?.data?.message || 'Failed to update archive status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this abode? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/abodes/${id}`);
      toast.success('Abode deleted successfully');
      fetchAbodes();
    } catch (err: any) {
      console.error('Error deleting abode:', err);
      toast.error(err.response?.data?.message || 'Failed to delete abode');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AbodeSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-transparent mb-4"></div>
            <div className="text-xl font-medium text-slate-900">Loading your abodes...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AbodeSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8 lg:p-10">
          {/* Modern Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 via-indigo-700 to-slate-800 p-8 md:p-12 shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-slate-500/10 rounded-full blur-2xl -ml-36 -mb-36"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">My Abodes</h1>
                    <p className="text-white/90 text-lg">Manage and monitor your abode listings</p>
                  </div>
                </div>
                
                {abodes.length > 0 && (
                  <div className="mt-6 flex items-center gap-6">
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/30">
                      <div className="text-white/70 text-sm font-medium mb-1">Total Abodes</div>
                      <div className="text-white text-3xl font-bold">{abodes.length}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/30">
                      <div className="text-white/70 text-sm font-medium mb-1">Average Rating</div>
                      <div className="text-white text-3xl font-bold">
                        {abodes.length > 0 
                          ? (abodes.reduce((sum, a) => sum + a.rating, 0) / abodes.length).toFixed(1)
                          : '0.0'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl shadow-lg"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </motion.div>
          )}

          {abodes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-12 shadow-xl border border-slate-100 text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">No Abodes Yet</h2>
              <p className="text-slate-700 mb-8 text-lg">
                Register your first abode to start sharing your home and culture with travelers
              </p>
              <button
                onClick={() => router.push('/adobes/register')}
                className="px-8 py-4 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all shadow-lg transform hover:scale-105"
              >
                Register Your Abode
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {abodes.map((abode, index) => (
                <motion.div
                  key={abode._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="md:flex">
                    {/* Image */}
                    <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden">
                      {abode.images && abode.images.length > 0 ? (
                        <img
                          src={getImageUrl(abode.images.find(img => img.isMain)?.url || abode.images[0].url) || undefined}
                          alt={abode.abodeDetails.title || abode.abodeDetails.description.substring(0, 50)}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-indigo-100 flex items-center justify-center">
                          <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                      {abode.isVerified && (
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </div>
                      )}
                        {abode.isArchived && (
                          <div className="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            Archived
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <div className="text-white text-2xl font-bold">
                          ₹{abode.pricing.pricePerNight}
                          <span className="text-sm font-normal ml-1">/night</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            {abode.abodeDetails.title || abode.abodeDetails.propertyType}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-slate-600 text-sm mb-3">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {abode.location.district}, {abode.location.state}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              {abode.abodeDetails.capacity} guests
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                              {abode.abodeDetails.bedrooms} bed • {abode.abodeDetails.bathrooms} bath
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-700 mb-4 line-clamp-2">
                        {abode.abodeDetails.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {abode.abodeDetails.amenities.slice(0, 5).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                        {abode.abodeDetails.amenities.length > 5 && (
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                            +{abode.abodeDetails.amenities.length - 5} more
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.floor(abode.rating)
                                    ? 'text-indigo-500'
                                    : 'text-slate-200'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-slate-700">
                            {abode.rating.toFixed(1)} ({abode.ratingCount} reviews)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <button
                            onClick={() => router.push(`/adobes/${abode._id}`)}
                            className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 rounded-lg hover:from-indigo-100 hover:to-blue-100 transition-all text-xs font-semibold flex items-center gap-1.5 border border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow-md group"
                            title="Preview public listing"
                          >
                            <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                          </button>
                          <button
                            onClick={() => router.push(`/host/abodes/edit/${abode._id}`)}
                            className="px-4 py-2 bg-gradient-to-r from-slate-600 to-indigo-600 text-white rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleArchive(abode._id, abode.isArchived || false)}
                            className={`px-4 py-2 rounded-xl transition-all text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
                              abode.isArchived
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                            }`}
                            title={abode.isArchived ? 'Unarchive to show to travelers' : 'Archive to hide from travelers'}
                          >
                            {abode.isArchived ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Unarchive
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                Archive
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(abode._id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all text-sm font-medium flex items-center gap-2 whitespace-nowrap border border-red-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add New Abode Button */}
          {abodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex justify-center"
            >
              <button
                onClick={() => router.push('/adobes/register')}
                className="px-8 py-4 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-3 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Register Another Abode
              </button>
            </motion.div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
