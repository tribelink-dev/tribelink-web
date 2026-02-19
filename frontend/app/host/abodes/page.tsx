'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import HostSidebar from '@/components/HostSidebar';
import ToastContainer, { useToast } from '@/components/Toast';
import { getImageUrl } from '@/lib/imageUtils';
import {
  Home,
  Plus,
  Edit,
  Eye,
  Trash2,
  MapPin,
  Users,
  DollarSign,
  MoreVertical,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import Link from 'next/link';

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
  isArchived?: boolean;
}

export default function HostAbodesPage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [abodes, setAbodes] = useState<Abode[]>([]);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState<{ [key: string]: boolean }>({});
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      setHost(JSON.parse(hostData));
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
      setMenuOpen({});
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
      setMenuOpen({});
    } catch (err: any) {
      console.error('Error deleting abode:', err);
      toast.error(err.response?.data?.message || 'Failed to delete abode');
    }
  };

  const toggleMenu = (id: string) => {
    setMenuOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HostSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600 mb-3"></div>
            <p className="text-sm text-gray-600">Loading abodes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HostSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Abodes</h1>
                <p className="text-gray-600 text-sm">Manage and view all your abode listings</p>
              </div>
              <button
                onClick={() => router.push('/adobes/register')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Abode
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Abodes List */}
          {abodes.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Abodes Yet</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                Start sharing your home with travelers and create authentic cultural experiences
              </p>
              <button
                onClick={() => router.push('/adobes/register')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Your First Abode
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {abodes.map((abode, index) => (
                <div
                  key={abode._id}
                  className="group relative bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Image */}
                  {abode.images && abode.images.length > 0 && (
                    <div className="relative h-40 bg-gray-100 overflow-hidden">
                      <img
                        src={getImageUrl(abode.images[0].url) || abode.images[0].url}
                        alt={abode.abodeDetails?.title || 'Abode'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {abode.isArchived && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-gray-900/70 text-white text-xs font-medium rounded">
                          Archived
                        </div>
                      )}
                      {/* Menu Button */}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => toggleMenu(abode._id)}
                          className="p-1.5 bg-white/90 backdrop-blur-sm rounded hover:bg-white transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                        {menuOpen[abode._id] && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setMenuOpen({})}
                            />
                            <div className="absolute right-0 top-10 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                              <button
                                onClick={() => handleArchive(abode._id, abode.isArchived || false)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                {abode.isArchived ? (
                                  <>
                                    <ArchiveRestore className="w-4 h-4" />
                                    Unarchive
                                  </>
                                ) : (
                                  <>
                                    <Archive className="w-4 h-4" />
                                    Archive
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  handleDelete(abode._id);
                                  setMenuOpen({});
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                      {abode.abodeDetails?.title || 'Untitled Abode'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {abode.location?.district}, {abode.location?.state}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{abode.abodeDetails?.capacity || 2} guests</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                        <DollarSign className="w-4 h-4 text-heritage-gold" />
                        <span>₹{abode.pricing?.pricePerNight || 0}/night</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Link
                        href={`/adobes/${abode._id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                      <Link
                        href={`/host/abodes/edit/${abode._id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

