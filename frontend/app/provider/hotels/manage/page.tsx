'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hostLogout } from '@/lib/providerUtils';
import api from '@/lib/api';
import Link from 'next/link';

interface Hotel {
  _id: string;
  name: string;
  description: string;
  location: {
    district: string;
    state: string;
    country: string;
    address?: string;
  };
  totalRooms: number;
  roomsAvailable: number;
  pricePerNight: number;
  rating: number;
  ratingCount: number;
  images: Array<{ url: string; isMain: boolean; _id?: string }>;
  amenities: string[];
  contact: {
    phone?: string;
    email?: string;
  };
  policies: {
    checkIn: string;
    checkOut: string;
    cancellationPolicy?: string;
  };
}

export default function ManageHotelsPage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'ACCOMMODATION_PROVIDER') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      fetchHotels();
    }
  }, [router]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError('');

      // Use the new endpoint for owner's hotels
      const response = await api.get('/hotels/owner/my-hotels');
      const myHotels = response.data.hotels || [];
      setHotels(myHotels);
    } catch (err: any) {
      console.error('Error fetching hotels:', err);
      setError(err.response?.data?.message || 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (hotelId: string) => {
    if (!confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(hotelId);
      setError('');
      
      await api.delete(`/hotels/${hotelId}`);
      setHotels(hotels.filter(h => h._id !== hotelId));
      setSuccess('Hotel deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete hotel');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHotels = hotels.filter(hotel =>
    hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hotel.location.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hotel.location.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="section-container max-w-7xl">
          <div className="content-card">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mb-6"></div>
                <div className="text-xl font-medium text-gray-700">Loading hotels...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                Manage Hotels
              </h1>
              <p className="text-lg text-gray-600">View and manage all your hotel properties</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/provider/hotels/add"
                className="btn-primary flex items-center gap-2 whitespace-nowrap shadow-medium hover:shadow-large transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Hotel
              </Link>
              <Link
                href="/provider/hotels"
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search hotels by name, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert-error mb-6 animate-slide-down bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-red-800">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button 
                onClick={() => setError('')} 
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {success && (
            <div className="alert-success mb-6 animate-slide-down bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-start gap-3">
              <span className="text-xl">✅</span>
              <div className="flex-1">
                <p className="font-semibold text-green-800">Success</p>
                <p className="text-green-700 text-sm mt-1">{success}</p>
              </div>
              <button 
                onClick={() => setSuccess('')} 
                className="text-green-500 hover:text-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Hotels Grid */}
        {filteredHotels.length === 0 ? (
          <div className="content-card">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <span className="text-4xl">🏨</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'No hotels found' : 'No hotels listed yet'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Start by adding your first hotel property to the platform'}
              </p>
              {!searchQuery && (
                <Link 
                  href="/provider/hotels/add" 
                  className="btn-primary inline-flex items-center gap-2 shadow-medium hover:shadow-large transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Hotel
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map((hotel) => (
              <div
                key={hotel._id}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:shadow-large transition-all duration-300 overflow-hidden group"
              >
                {hotel.images && hotel.images.length > 0 && (
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={hotel.images.find(img => img.isMain)?.url || hotel.images[0].url}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {hotel.rating > 0 ? hotel.rating.toFixed(1) : '5.0'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {hotel.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {hotel.description || `${hotel.location.district}, ${hotel.location.state}`}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Rooms</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {hotel.roomsAvailable} / {hotel.totalRooms} available
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="text-lg font-bold text-primary-600">
                        ${hotel.pricePerNight.toFixed(2)}/night
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Link
                      href={`/provider/hotels/${hotel._id}`}
                      className="flex-1 btn-primary text-center text-sm py-2"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(hotel._id)}
                      disabled={deletingId === hotel._id}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {deletingId === hotel._id ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

