import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  Globe, 
  BarChart3,
  Calendar,
  ExternalLink,
  Loader2,
  Search,
  Filter,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface PersonalSite {
  id: string;
  title: string;
  description: string;
  theme_id: string;
  status: string;
  custom_domain: string | null;
  site_url: string;
  created_at: string;
  updated_at: string;
  analytics?: {
    views: number;
    unique_visitors: number;
    last_30_days: number;
  };
}

const PersonalSiteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<PersonalSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await fetch('/api/personal-sites', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load sites');
      }

      const result = await response.json();
      if (result.success) {
        setSites(result.data);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
      toast.error('Failed to load your sites');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
      return;
    }

    setDeletingSiteId(siteId);

    try {
      const response = await fetch(`/api/personal-sites/${siteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete site');
      }

      setSites(prev => prev.filter(site => site.id !== siteId));
      toast.success('Site deleted successfully');
    } catch (error) {
      console.error('Error deleting site:', error);
      toast.error('Failed to delete site');
    } finally {
      setDeletingSiteId(null);
    }
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Published</span>;
      case 'draft':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Draft</span>;
      case 'private':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Private</span>;
      default:
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Personal Sites</h1>
              <p className="text-gray-600 mt-2">Manage your AI-generated personal websites</p>
            </div>
            <button
              onClick={() => navigate('/personal-site-generator/upload')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Site</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sites</p>
                <p className="text-2xl font-bold text-gray-900">{sites.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sites.filter(s => s.status === 'published').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Edit3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sites.filter(s => s.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sites.reduce((total, site) => total + (site.analytics?.views || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sites Grid */}
        {filteredSites.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            {sites.length === 0 ? (
              <>
                <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No sites yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first AI-generated personal website by uploading your resume
                </p>
                <button
                  onClick={() => navigate('/personal-site-generator/upload')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </button>
              </>
            ) : (
              <>
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No sites found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSites.map((site) => (
              <div key={site.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{site.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{site.description}</p>
                    </div>
                    {getStatusBadge(site.status)}
                  </div>

                  {/* Analytics */}
                  {site.analytics && (
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">{site.analytics.views}</p>
                        <p className="text-xs text-gray-600">Total Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">{site.analytics.unique_visitors}</p>
                        <p className="text-xs text-gray-600">Unique Visitors</p>
                      </div>
                    </div>
                  )}

                  {/* Site URL */}
                  {site.site_url && (
                    <div className="mb-4">
                      <a
                        href={site.site_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                      >
                        <span className="truncate">{site.site_url}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-1 mb-1">
                      <Calendar className="h-3 w-3" />
                      <span>Created: {formatDate(site.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Updated: {formatDate(site.updated_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      {site.site_url && (
                        <button
                          onClick={() => window.open(site.site_url, '_blank')}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Site"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => navigate(`/personal-site-generator/edit/${site.id}`)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Site"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteSite(site.id)}
                      disabled={deletingSiteId === site.id}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Site"
                    >
                      {deletingSiteId === site.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
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
};

export default PersonalSiteDashboard;