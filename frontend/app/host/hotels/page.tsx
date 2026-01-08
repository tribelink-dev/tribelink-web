'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '@/lib/indianStates';
import { getImageUrl } from '@/lib/imageUtils';
import HostSidebar from '@/components/HostSidebar';

interface Hotel {
  _id: string;
  name: string;
  description?: string;
  images: Array<{ url: string; isMain: boolean }>;
  amenities: string[];
  location: {
    country: string;
    state: string;
    district: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  totalRooms: number;
  roomsAvailable: number;
  pricePerNight: number;
  rating: number;
  ratingCount: number;
  contact?: {
    phone?: string;
    email?: string;
  };
  policies?: {
    checkIn: string;
    checkOut: string;
    cancellationPolicy?: string;
  };
}

const AMENITIES_OPTIONS = [
  'WiFi', 'Pool', 'Gym', 'Breakfast', 'Parking', 'Air Conditioning', 
  'Room Service', 'Restaurant', 'Bar', 'Spa', 'Laundry', 'Elevator'
];

export default function HostHotelsPage() {
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!host || !token) {
        router.push('/host/login');
        return;
      }
    }
    fetchHotels();
  }, [router]);

  const fetchHotels = async () => {
    try {
      const response = await api.get('/hotels');
      const allHotels = response.data.hotels || [];
      // Filter hotels created by current host (or show all if admin)
      const host = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('host') || '{}') : null;
      const filteredHotels = allHotels.filter((hotel: any) => 
        !hotel.createdBy || hotel.createdBy === host?._id || !host?._id
      );
      setHotels(filteredHotels);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (hotelId: string) => {
    if (!confirm('Are you sure you want to delete this hotel?')) return;

    try {
      await api.delete(`/hotels/${hotelId}`);
      setHotels(hotels.filter(h => h._id !== hotelId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete hotel');
    }
  };

  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = !searchTerm || 
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.location.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !filterState || hotel.location.state === filterState;
    return matchesSearch && matchesState;
  });


  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading hotels...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HostSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="heading-secondary text-gray-900 mb-2">
              My Hotels
            </h1>
            <p className="text-gray-600">
              Manage and view all your listed hotels
            </p>
          </div>
          <button
            onClick={() => router.push('/host/hotels/add')}
            className="btn-primary"
          >
            + Add New Hotel
          </button>
        </div>

        {/* Search and Filter */}
        <div className="content-card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Hotels
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or location..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by State
              </label>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="input-field"
              >
                <option value="">All States</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert-error mb-6">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {filteredHotels.length === 0 ? (
          <div className="content-card text-center py-16">
            <div className="text-6xl mb-4">🏨</div>
            <p className="text-xl text-gray-700 mb-2 font-semibold">
              {searchTerm || filterState ? 'No hotels found' : 'No hotels yet'}
            </p>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterState 
                ? 'Try adjusting your search criteria' 
                : 'Start by creating your first hotel'}
            </p>
            {!searchTerm && !filterState && (
              <button
                onClick={() => router.push('/host/hotels/add')}
                className="btn-primary"
              >
                Create Your First Hotel
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map((hotel) => {
              const mainImage = hotel.images?.find(img => img.isMain) || hotel.images?.[0];
              const imageUrl = mainImage ? getImageUrl(mainImage.url ?? undefined) : null;
              
              return (
                <div key={hotel._id} className="card-professional card-hover overflow-hidden flex flex-col">
                  {imageUrl ? (
                    <div className="w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={hotel.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-gradient-primary flex items-center justify-center">
                      <span className="text-6xl">🏨</span>
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{hotel.name}</h3>
                    {hotel.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{hotel.description}</p>
                    )}
                    
                    <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📍</span>
                        <span>{hotel.location.district}, {hotel.location.state}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>💰</span>
                        <span className="font-semibold text-primary-600">${hotel.pricePerNight}</span>
                        <span className="text-gray-500">per night</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>🛏️</span>
                        <span>{hotel.roomsAvailable} / {hotel.totalRooms} rooms available</span>
                      </div>
                      {hotel.rating > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="badge-rating">
                            <span>⭐</span>
                            {hotel.rating.toFixed(1)}
                            {hotel.ratingCount > 0 && (
                              <span className="ml-1 text-xs">({hotel.ratingCount} reviews)</span>
                            )}
                          </div>
                        </div>
                      )}
                      {hotel.amenities && hotel.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                              {amenity}
                            </span>
                          ))}
                          {hotel.amenities.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                              +{hotel.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/host/hotels/edit/${hotel._id}`)}
                        className="btn-secondary flex-1 text-sm py-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(hotel._id)}
                        className="btn-secondary flex-1 text-sm py-2 text-red-600 hover:bg-red-50"
                      >
                        Delete
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
      </div>
    </div>
  );
}

