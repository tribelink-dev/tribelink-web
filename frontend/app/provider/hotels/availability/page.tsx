'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hostLogout } from '@/lib/providerUtils';
import api from '@/lib/api';
import Link from 'next/link';

interface Hotel {
  _id: string;
  name: string;
  totalRooms: number;
  roomsAvailable: number;
  availability: Array<{
    date: string;
    roomsAvailable: number;
  }>;
}

interface AvailabilityDate {
  date: string;
  roomsAvailable: number;
  isAvailable: boolean;
}

export default function AvailabilityPage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [selectedHotelData, setSelectedHotelData] = useState<Hotel | null>(null);
  const [availability, setAvailability] = useState<AvailabilityDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [roomsForDate, setRoomsForDate] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  useEffect(() => {
    if (selectedHotel) {
      fetchHotelAvailability(selectedHotel);
    }
  }, [selectedHotel, currentMonth]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError('');

      // Use the new endpoint for owner's hotels
      const response = await api.get('/hotels/owner/my-hotels');
      const myHotels = response.data.hotels || [];
      setHotels(myHotels);
      if (myHotels.length > 0 && !selectedHotel) {
        setSelectedHotel(myHotels[0]._id);
      }
    } catch (err: any) {
      console.error('Error fetching hotels:', err);
      setError(err.response?.data?.message || 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotelAvailability = async (hotelId: string) => {
    try {
      setError('');
      const hotel = hotels.find(h => h._id === hotelId);
      if (!hotel) {
        const response = await api.get(`/hotels/${hotelId}`);
        setSelectedHotelData(response.data.hotel);
      } else {
        setSelectedHotelData(hotel);
      }

      // Generate calendar for current month
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dates: AvailabilityDate[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const existingAvailability = hotel?.availability?.find(
          (a: any) => new Date(a.date).toISOString().split('T')[0] === dateStr
        );
        
        dates.push({
          date: dateStr,
          roomsAvailable: existingAvailability?.roomsAvailable || hotel?.roomsAvailable || 0,
          isAvailable: (existingAvailability?.roomsAvailable || hotel?.roomsAvailable || 0) > 0
        });
      }

      setAvailability(dates);
    } catch (err: any) {
      console.error('Error fetching availability:', err);
      setError(err.response?.data?.message || 'Failed to load availability');
    }
  };

  const handleUpdateAvailability = async (date: string, rooms: number) => {
    if (!selectedHotel) return;

    try {
      setSaving(true);
      setError('');

      // Update availability via API
      await api.put(`/hotels/${selectedHotel}/availability`, {
        date,
        roomsAvailable: rooms
      });
      
      setSuccess(`Availability updated for ${new Date(date).toLocaleDateString()}`);
      setTimeout(() => setSuccess(''), 3000);

      // Update local state
      setAvailability(availability.map(a => 
        a.date === date 
          ? { ...a, roomsAvailable: rooms, isAvailable: rooms > 0 }
          : a
      ));

      // Refresh hotel data
      if (selectedHotelData) {
        const updatedHotel = { ...selectedHotelData };
        const dateObj = new Date(date);
        const existingIndex = updatedHotel.availability?.findIndex((a: any) => 
          new Date(a.date).toISOString().split('T')[0] === date
        );
        if (existingIndex >= 0 && updatedHotel.availability) {
          updatedHotel.availability[existingIndex].roomsAvailable = rooms;
        } else {
          updatedHotel.availability = updatedHotel.availability || [];
          updatedHotel.availability.push({ date: dateObj, roomsAvailable: rooms });
        }
        setSelectedHotelData(updatedHotel);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update availability');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const openDateModal = (date: string, currentRooms: number) => {
    setSelectedDate(date);
    setRoomsForDate(currentRooms);
  };

  const saveDateAvailability = () => {
    if (selectedDate && roomsForDate >= 0 && roomsForDate <= (selectedHotelData?.totalRooms || 0)) {
      handleUpdateAvailability(selectedDate, roomsForDate);
      setSelectedDate('');
      setRoomsForDate(0);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="section-container max-w-7xl">
          <div className="content-card">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mb-6"></div>
                <div className="text-xl font-medium text-gray-700">Loading availability...</div>
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
                Room Availability
              </h1>
              <p className="text-lg text-gray-600">Manage room availability calendar</p>
            </div>
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

          {/* Hotel Selector */}
          {hotels.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Select Hotel
              </label>
              <select
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                className="w-full md:w-auto px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              >
                {hotels.map((hotel) => (
                  <option key={hotel._id} value={hotel._id}>
                    {hotel.name} ({hotel.totalRooms} rooms)
                  </option>
                ))}
              </select>
            </div>
          )}

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

        {hotels.length === 0 ? (
          <div className="content-card">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <span className="text-4xl">🏨</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No hotels found</h3>
              <p className="text-gray-600 mb-8">Add a hotel first to manage availability</p>
              <Link 
                href="/provider/hotels/add" 
                className="btn-primary inline-flex items-center gap-2"
              >
                Add Hotel
              </Link>
            </div>
          </div>
        ) : selectedHotelData ? (
          <div className="content-card">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedHotelData.name}</h2>
              <p className="text-gray-600">
                Total Rooms: <span className="font-semibold">{selectedHotelData.totalRooms}</span> | 
                Currently Available: <span className="font-semibold">{selectedHotelData.roomsAvailable}</span>
              </p>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth('prev')}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <h3 className="text-xl font-bold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="btn-secondary flex items-center gap-2"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}
              {getDaysInMonth().map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-20"></div>;
                }

                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dateStr = date.toISOString().split('T')[0];
                const dayAvailability = availability.find(a => a.date === dateStr);
                const rooms = dayAvailability?.roomsAvailable || selectedHotelData.roomsAvailable;
                const isAvailable = dayAvailability?.isAvailable ?? true;
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <button
                    key={day}
                    onClick={() => !isPast && openDateModal(dateStr, rooms)}
                    disabled={isPast}
                    className={`h-20 p-2 border-2 rounded-lg text-left transition-all ${
                      isPast
                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                        : isAvailable
                        ? 'bg-green-50 border-green-200 hover:border-green-300 hover:shadow-medium'
                        : 'bg-red-50 border-red-200 hover:border-red-300 hover:shadow-medium'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-900 mb-1">{day}</div>
                    <div className={`text-xs ${isAvailable ? 'text-green-700' : 'text-red-700'}`}>
                      {rooms} rooms
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-50 border-2 border-red-200 rounded"></div>
                <span>Fully Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded"></div>
                <span>Past Date</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Date Availability Modal */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Update Availability for {new Date(selectedDate).toLocaleDateString()}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Rooms Available (0 - {selectedHotelData?.totalRooms || 0})
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedHotelData?.totalRooms || 0}
                  value={roomsForDate}
                  onChange={(e) => setRoomsForDate(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedDate('');
                    setRoomsForDate(0);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDateAvailability}
                  disabled={saving || roomsForDate < 0 || roomsForDate > (selectedHotelData?.totalRooms || 0)}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

