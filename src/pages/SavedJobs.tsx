import React, { useState, useEffect } from 'react';
import { Search, Filter, Briefcase, DollarSign, Clock, MapPin, Star, Trash2, ExternalLink, FileText, Eye } from 'lucide-react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { isFeatureEnabled } from '../config/featureFlags';
import ComingSoon from '../components/ComingSoon';

interface SavedJob {
  id: string;
  job_id: string;
  user_id: string;
  notes?: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    description: string;
    budget_min?: number;
    budget_max?: number;
    hourly_rate_min?: number;
    hourly_rate_max?: number;
    budget_type: 'fixed' | 'hourly';
    skills: string[];
    client_name?: string;
    client_rating?: number;
    client_reviews_count?: number;
    client_location?: string;
    posted_date: string;
    proposals_count?: number;
    source_url?: string;
  };
}

interface Proposal {
  id: string;
  job_id: string;
  user_id: string;
  content: string;
  estimated_hours?: number;
  proposed_rate?: number;
  tone: string;
  key_points: string[];
  call_to_action: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    budget_type: 'fixed' | 'hourly';
  };
}

type TabType = 'saved' | 'proposals';

const SavedJobs: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<TabType>('saved');
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const itemsPerPage = 10;

  // Fetch saved jobs
  const fetchSavedJobs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });

      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/saved-jobs?${params}`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });
      
      const data = await response.json();

      if (response.ok) {
        setSavedJobs(data.saved_jobs || []);
        setTotalItems(data.total || 0);
      } else {
        toast.error('Failed to fetch saved jobs');
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      toast.error('Error fetching saved jobs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch proposals
  const fetchProposals = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });

      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/proposals?${params}`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });
      
      const data = await response.json();

      if (response.ok) {
        setProposals(data.proposals || []);
        setTotalItems(data.total || 0);
      } else {
        toast.error('Failed to fetch proposals');
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Error fetching proposals');
    } finally {
      setLoading(false);
    }
  };

  // Remove saved job
  const removeSavedJob = async (savedJobId: string) => {
    try {
      const response = await fetch(`/api/saved-jobs/${savedJobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });

      if (response.ok) {
        toast.success('Job removed from saved list');
        fetchSavedJobs(currentPage);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove job');
      }
    } catch (error) {
      console.error('Error removing saved job:', error);
      toast.error('Error removing saved job');
    }
  };

  // Delete proposal
  const deleteProposal = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });

      if (response.ok) {
        toast.success('Proposal deleted');
        fetchProposals(currentPage);
        if (selectedProposal?.id === proposalId) {
          setSelectedProposal(null);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete proposal');
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error('Error deleting proposal');
    }
  };

  // Copy proposal to clipboard
  const copyProposal = async (proposal: Proposal) => {
    try {
      await navigator.clipboard.writeText(proposal.content);
      toast.success('Proposal copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy proposal');
    }
  };

  // Format budget display
  const formatBudget = (job: any) => {
    if (job.budget_type === 'hourly' && job.hourly_rate_min && job.hourly_rate_max) {
      return `$${job.hourly_rate_min}-$${job.hourly_rate_max}/hr`;
    } else if (job.budget_type === 'fixed' && job.budget_min && job.budget_max) {
      return `$${job.budget_min.toLocaleString()}-$${job.budget_max.toLocaleString()}`;
    }
    return 'Budget not specified';
  };

  // Format posted date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    if (activeTab === 'saved') {
      fetchSavedJobs(1);
    } else {
      fetchProposals(1);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm('');
    setSelectedProposal(null);
  };

  useEffect(() => {
    if (!user) return;
    
    if (activeTab === 'saved') {
      fetchSavedJobs(1);
    } else {
      fetchProposals(1);
    }
  }, [activeTab, user]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Coming Soon Overlay */}
      {!isFeatureEnabled('savedJobs') && (
        <ComingSoon
          title="Saved Jobs"
          description="Your saved jobs management system is coming soon! Save jobs you're interested in and manage your job search pipeline."
          variant="overlay"
        />
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Star className="h-8 w-8 text-blue-600" />
                My Saved Jobs
              </h1>
              <p className="text-gray-600 mt-1">Manage your saved jobs and generated proposals</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => handleTabChange('saved')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'saved'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Saved Jobs
                </div>
              </button>
              <button
                onClick={() => handleTabChange('proposals')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'proposals'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  My Proposals
                </div>
              </button>
            </nav>
          </div>

          {/* Search */}
          <div className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={`Search ${activeTab === 'saved' ? 'saved jobs' : 'proposals'}...`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className={`${selectedProposal ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              {activeTab === 'saved' ? (
                // Saved Jobs
                savedJobs.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs</h3>
                    <p className="text-gray-600 mb-4">Start saving jobs you're interested in</p>
                    <button
                      onClick={() => window.location.href = '/jobs'}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Browse Jobs
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Results Header */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <p className="text-gray-600">
                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} saved jobs
                      </p>
                    </div>

                    {/* Saved Job Cards */}
                    {savedJobs.map((savedJob) => (
                      <div key={savedJob.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                        <div className="p-6">
                          {/* Job Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {savedJob.job.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {formatBudget(savedJob.job)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Saved {formatDate(savedJob.created_at)}
                                </span>
                                {savedJob.job.client_location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {savedJob.job.client_location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeSavedJob(savedJob.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove from saved"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                              {savedJob.job.source_url && (
                                <a
                                  href={savedJob.job.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View on Upwork"
                                >
                                  <ExternalLink className="h-5 w-5" />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Job Description */}
                          <p className="text-gray-700 mb-4 line-clamp-2">
                            {savedJob.job.description}
                          </p>

                          {/* Skills */}
                          {savedJob.job.skills && savedJob.job.skills.length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-2">
                                {savedJob.job.skills.slice(0, 4).map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {savedJob.job.skills.length > 4 && (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                                    +{savedJob.job.skills.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {savedJob.notes && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                <strong>Notes:</strong> {savedJob.notes}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {savedJob.job.client_name && (
                                <span>{savedJob.job.client_name}</span>
                              )}
                              {savedJob.job.client_rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                  <span>{savedJob.job.client_rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => window.location.href = `/job-details/${savedJob.job.id}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Proposals
                proposals.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals generated</h3>
                    <p className="text-gray-600 mb-4">Generate your first AI proposal for a job</p>
                    <button
                      onClick={() => window.location.href = '/jobs'}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Browse Jobs
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Results Header */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <p className="text-gray-600">
                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} proposals
                      </p>
                    </div>

                    {/* Proposal Cards */}
                    {proposals.map((proposal) => (
                      <div key={proposal.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                        <div className="p-6">
                          {/* Proposal Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {proposal.job.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Generated {formatDate(proposal.created_at)}
                                </span>
                                <span className="capitalize px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {proposal.tone}
                                </span>
                                {proposal.estimated_hours && (
                                  <span className="text-gray-500">
                                    {proposal.estimated_hours}h estimated
                                  </span>
                                )}
                                {proposal.proposed_rate && (
                                  <span className="text-green-600 font-medium">
                                    ${proposal.proposed_rate}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedProposal(proposal)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View proposal"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => copyProposal(proposal)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Copy proposal"
                              >
                                <FileText className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => deleteProposal(proposal.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete proposal"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>

                          {/* Proposal Preview */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-700 line-clamp-3">
                              {proposal.content}
                            </p>
                          </div>

                          {/* Key Points */}
                          {proposal.key_points && proposal.key_points.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Key Points:</h4>
                              <div className="flex flex-wrap gap-2">
                                {proposal.key_points.slice(0, 3).map((point, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                  >
                                    {point}
                                  </span>
                                ))}
                                {proposal.key_points.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    +{proposal.key_points.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="text-sm text-gray-500">
                              Job Type: <span className="capitalize">{proposal.job.budget_type}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => copyProposal(proposal)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                Copy Proposal
                              </button>
                              <button
                                onClick={() => setSelectedProposal(proposal)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                View Full
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        setCurrentPage(newPage);
                        if (activeTab === 'saved') {
                          fetchSavedJobs(newPage);
                        } else {
                          fetchProposals(newPage);
                        }
                      }}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            if (activeTab === 'saved') {
                              fetchSavedJobs(pageNum);
                            } else {
                              fetchProposals(pageNum);
                            }
                          }}
                          className={`px-3 py-2 rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => {
                        const newPage = Math.min(totalPages, currentPage + 1);
                        setCurrentPage(newPage);
                        if (activeTab === 'saved') {
                          fetchSavedJobs(newPage);
                        } else {
                          fetchProposals(newPage);
                        }
                      }}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Proposal Detail Sidebar */}
            {selectedProposal && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Proposal Details</h3>
                    <button
                      onClick={() => setSelectedProposal(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Job Title */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{selectedProposal.job.title}</h4>
                      <p className="text-sm text-gray-500">Generated {formatDate(selectedProposal.created_at)}</p>
                    </div>
                    
                    {/* Proposal Content */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Proposal Content:</h5>
                      <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedProposal.content}
                        </p>
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Tone:</span>
                        <p className="text-gray-900 capitalize">{selectedProposal.tone}</p>
                      </div>
                      {selectedProposal.estimated_hours && (
                        <div>
                          <span className="font-medium text-gray-500">Hours:</span>
                          <p className="text-gray-900">{selectedProposal.estimated_hours}h</p>
                        </div>
                      )}
                      {selectedProposal.proposed_rate && (
                        <div className="col-span-2">
                          <span className="font-medium text-gray-500">Proposed Rate:</span>
                          <p className="text-gray-900">${selectedProposal.proposed_rate}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Key Points */}
                    {selectedProposal.key_points && selectedProposal.key_points.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Key Points:</h5>
                        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                          {selectedProposal.key_points.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Call to Action */}
                    {selectedProposal.call_to_action && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Call to Action:</h5>
                        <p className="text-sm text-gray-700">{selectedProposal.call_to_action}</p>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => copyProposal(selectedProposal)}
                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors text-sm"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => deleteProposal(selectedProposal.id)}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;