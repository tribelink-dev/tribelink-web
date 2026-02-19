'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import HostSidebar from '@/components/HostSidebar';
import ToastContainer, { useToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home,
  Sparkles, 
  Plus,
  Edit,
  Eye,
  Trash2,
  MapPin,
  Users,
  DollarSign,
  Clock,
  MoreVertical,
  Archive,
  ArchiveRestore,
  BarChart3
} from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import Link from 'next/link';

type TabType = 'abodes' | 'experiences';

export default function HostDashboard() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('abodes');
  const [abodes, setAbodes] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [abodesLoading, setAbodesLoading] = useState(true);
  const [experiencesLoading, setExperiencesLoading] = useState(true);
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
      setLoading(false);
      fetchAbodes();
      fetchExperiences();
    }
  }, [router]);

  const fetchAbodes = async () => {
    try {
      setAbodesLoading(true);
      const response = await api.get('/abodes/owner/my-abodes').catch(() => ({ data: { abodes: [] } }));
      setAbodes(response.data.abodes || []);
    } catch (error) {
      console.error('Error fetching abodes:', error);
      toast.error('Failed to load abodes');
    } finally {
      setAbodesLoading(false);
          }
  };

  const fetchExperiences = async () => {
    try {
      setExperiencesLoading(true);
      const response = await api.get('/hosts/experiences').catch(() => ({ data: { experiences: [] } }));
      setExperiences(response.data.experiences || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
      toast.error('Failed to load experiences');
    } finally {
      setExperiencesLoading(false);
    }
  };
  
  const handleDeleteAbode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this abode? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/abodes/${id}`);
      toast.success('Abode deleted successfully');
      fetchAbodes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete abode');
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/hosts/experience/${id}`);
      toast.success('Experience deleted successfully');
      fetchExperiences();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete experience');
    }
  };

  const handleArchiveExperience = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/hosts/experience/${id}/archive`);
      toast.success(currentStatus ? 'Experience unarchived successfully' : 'Experience archived successfully');
      fetchExperiences();
      setMenuOpen({});
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update experience');
    }
  };

  const toggleMenu = (id: string) => {
    setMenuOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600 mb-3"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const currentItems = activeTab === 'abodes' ? abodes : experiences;
  const isLoading = activeTab === 'abodes' ? abodesLoading : experiencesLoading;
  const addRoute = activeTab === 'abodes' ? '/adobes/register' : '/host/experiences/add';
  const emptyIcon = activeTab === 'abodes' ? Home : Sparkles;
  const EmptyIcon = emptyIcon;

  return (
    <div className="min-h-screen bg-gray-50">
      <HostSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* Simple Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-1">
                  Welcome back, {host?.name?.split(' ')[0] || 'Host'}
                </h1>
                <p className="text-gray-600 text-sm">
                  Manage your {activeTab === 'abodes' ? 'abodes' : 'experiences'}
                </p>
              </div>
              <Link
                href="/host/analytics"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
                  </div>
                  
            {/* Tab Navigation */}
            <div className="flex gap-3 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('abodes')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'abodes'
                    ? 'border-heritage-gold text-heritage-gold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span>Abodes</span>
                  {abodes.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      {abodes.length}
                    </span>
                            )}
                          </div>
              </button>
              <button
                onClick={() => setActiveTab('experiences')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'experiences'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Experiences</span>
                  {experiences.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      {experiences.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Header with Add Button */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  My {activeTab === 'abodes' ? 'Abodes' : 'Experiences'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {currentItems.length === 0 
                    ? `No ${activeTab} yet` 
                    : `${currentItems.length} ${activeTab === 'abodes' ? 'abode' : 'experience'}${currentItems.length !== 1 ? 's' : ''} listed`
                  }
                </p>
              </div>
              <button
                onClick={() => router.push(addRoute)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                <Plus className="w-4 h-4" />
                Add {activeTab === 'abodes' ? 'Abode' : 'Experience'}
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600 mb-3"></div>
                    <p className="text-sm text-gray-600">Loading...</p>
                  </div>
                </div>
              ) : currentItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <EmptyIcon className="w-8 h-8 text-gray-400" />
              </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No {activeTab === 'abodes' ? 'Abodes' : 'Experiences'} Yet
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                    {activeTab === 'abodes' 
                      ? 'Start sharing your home with travelers and create authentic cultural experiences'
                      : 'Create unique cultural experiences and share them with travelers from around the world'
                    }
                  </p>
                  <button
                    onClick={() => router.push(addRoute)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First {activeTab === 'abodes' ? 'Abode' : 'Experience'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {currentItems.map((item, index) => (
              <motion.div 
                        key={item._id}
                        initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="group relative bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all overflow-hidden"
                      >
                        {/* Image */}
                        {(item.images?.[0]?.url || item.imageUrl) && (
                          <div className="relative h-40 bg-gray-100 overflow-hidden">
                            <img
                              src={getImageUrl(item.images?.[0]?.url || item.imageUrl) || (item.images?.[0]?.url || item.imageUrl)}
                              alt={item.abodeDetails?.title || item.title || 'Listing'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {item.isArchived && (
                              <div className="absolute top-2 right-2 px-2 py-1 bg-gray-900/70 text-white text-xs font-medium rounded">
                                Archived
                </div>
                            )}
                            {/* Menu Button */}
                            <div className="absolute top-2 right-2">
                              <button
                                onClick={() => toggleMenu(item._id)}
                                className="p-1.5 bg-white/90 backdrop-blur-sm rounded hover:bg-white transition-colors"
              >
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </button>
                              {menuOpen[item._id] && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setMenuOpen({})}
                                  />
                                  <div className="absolute right-0 top-10 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                                    {activeTab === 'experiences' && (
                                      <button
                                        onClick={() => handleArchiveExperience(item._id, item.isArchived || false)}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        {item.isArchived ? (
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
                                    )}
                                    <button
                                      onClick={() => {
                                        if (activeTab === 'abodes') {
                                          handleDeleteAbode(item._id);
                                        } else {
                                          handleDeleteExperience(item._id);
                                        }
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
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                            {item.abodeDetails?.title || item.title || 'Untitled'}
                              </h3>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="line-clamp-1">
                              {item.location?.district}, {item.location?.state}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-4">
                            {activeTab === 'abodes' ? (
                              <>
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <Users className="w-4 h-4" />
                                  <span>{item.abodeDetails?.capacity || 2} guests</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                                  <DollarSign className="w-4 h-4 text-heritage-gold" />
                                  <span>₹{item.pricing?.pricePerNight || 0}/night</span>
                                  </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{item.duration || 2}h</span>
                              </div>
                                <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                                  <DollarSign className="w-4 h-4 text-indigo-600" />
                                  <span>₹{item.price || 0}</span>
                            </div>
                              </>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                            <Link
                              href={activeTab === 'abodes' ? `/adobes/${item._id}` : `/experiences/${item._id}`}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </Link>
                            <Link
                              href={activeTab === 'abodes' ? `/host/abodes/edit/${item._id}` : `/host/experiences/edit/${item._id}`}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </Link>
                      </div>
                    </div>
                      </motion.div>
                  ))}
                  </AnimatePresence>
                </div>
              )}
                </div>
              </div>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
