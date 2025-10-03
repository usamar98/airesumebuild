/**
 * Company Profile Dashboard Component
 * Comprehensive company profile management with branding, team management, verification, and culture features
 */
import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useRoleManagement } from '../hooks/useRoleManagement';
import {
  BuildingOfficeIcon,
  PhotoIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  ShareIcon,
  CameraIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeIconSolid } from '@heroicons/react/24/solid';

interface Company {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  cover_image_url?: string;
  industry: string;
  company_size: string;
  website?: string;
  social_links: Record<string, string>;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'hr_manager' | 'recruiter' | 'hiring_manager';
  status: 'pending' | 'active' | 'inactive';
  permissions: Record<string, boolean>;
  invited_at: string;
  joined_at?: string;
  user?: {
    email: string;
    full_name?: string;
  };
}

const CompanyProfileDashboard: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { userRole, canAccessFeature } = useRoleManagement();
  const [company, setCompany] = useState<Company | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Company>>({});

  useEffect(() => {
    if (user) {
      fetchCompanyData();
      fetchTeamMembers();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual Supabase calls
      const mockCompany: Company = {
        id: '1',
        name: 'TechCorp Solutions',
        description: 'Leading technology solutions provider specializing in enterprise software development and digital transformation. We help businesses modernize their operations through innovative technology solutions.',
        logo_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20tech%20company%20logo%20minimalist%20blue%20gradient&image_size=square',
        cover_image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20office%20space%20with%20glass%20walls%20and%20collaborative%20work%20areas&image_size=landscape_16_9',
        industry: 'Technology',
        company_size: '100-500',
        website: 'https://techcorp.com',
        social_links: {
          linkedin: 'https://linkedin.com/company/techcorp',
          twitter: 'https://twitter.com/techcorp',
          facebook: 'https://facebook.com/techcorp'
        },
        verification_status: 'verified',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T15:30:00Z'
      };
      setCompany(mockCompany);
      setEditForm(mockCompany);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // Mock data for now - replace with actual Supabase calls
      const mockTeamMembers: TeamMember[] = [
        {
          id: '1',
          user_id: user?.id || '',
          role: 'admin',
          status: 'active',
          permissions: { manage_team: true, manage_jobs: true, view_analytics: true },
          invited_at: '2024-01-15T10:00:00Z',
          joined_at: '2024-01-15T10:00:00Z',
          user: { email: user?.email || '', full_name: 'John Doe' }
        },
        {
          id: '2',
          user_id: '2',
          role: 'hr_manager',
          status: 'active',
          permissions: { manage_jobs: true, view_analytics: true },
          invited_at: '2024-01-16T09:00:00Z',
          joined_at: '2024-01-16T09:30:00Z',
          user: { email: 'sarah@techcorp.com', full_name: 'Sarah Johnson' }
        },
        {
          id: '3',
          user_id: '3',
          role: 'recruiter',
          status: 'pending',
          permissions: { manage_jobs: false, view_analytics: false },
          invited_at: '2024-01-18T14:00:00Z',
          user: { email: 'mike@techcorp.com', full_name: 'Mike Wilson' }
        }
      ];
      setTeamMembers(mockTeamMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleSaveCompany = async () => {
    try {
      // Here you would make the actual Supabase update call
      console.log('Saving company data:', editForm);
      setCompany({ ...company!, ...editForm });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving company data:', error);
    }
  };

  const handleInviteTeamMember = async (email: string, role: string) => {
    try {
      // Here you would make the actual Supabase insert call
      console.log('Inviting team member:', { email, role });
      // Refresh team members list
      fetchTeamMembers();
    } catch (error) {
      console.error('Error inviting team member:', error);
    }
  };

  const getVerificationBadge = () => {
    switch (company?.verification_status) {
      case 'verified':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckBadgeIconSolid className="h-5 w-5" />
            <span className="text-sm font-medium">Verified Company</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <CheckBadgeIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Verification Pending</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <CheckBadgeIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Verification Rejected</span>
          </div>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BuildingOfficeIcon },
    { id: 'branding', name: 'Branding', icon: PhotoIcon },
    { id: 'team', name: 'Team', icon: UserGroupIcon },
    { id: 'verification', name: 'Verification', icon: CheckBadgeIcon },
    { id: 'culture', name: 'Culture', icon: GlobeAltIcon }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your company information, branding, and team
              </p>
            </div>
            <div className="flex items-center gap-4">
              {getVerificationBadge()}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {company?.cover_image_url && (
        <div className="relative h-64 bg-gray-200">
          <img
            src={company.cover_image_url}
            alt="Company cover"
            className="w-full h-full object-cover"
          />
          {isEditing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <button className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md text-white hover:bg-white hover:text-gray-900 transition-colors">
                <CameraIcon className="h-4 w-4 mr-2" />
                Change Cover
              </button>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              {company?.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-24 w-24 rounded-lg object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-gray-200 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
              {isEditing && (
                <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                  <CameraIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 bg-transparent focus:outline-none"
                    placeholder="Company Name"
                  />
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full text-gray-600 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Company Description"
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={handleSaveCompany}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{company?.name}</h2>
                  <p className="mt-2 text-gray-600">{company?.description}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" />
                      <span>{company?.industry}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{company?.company_size} employees</span>
                    </div>
                    {company?.website && (
                      <div className="flex items-center gap-1">
                        <GlobeAltIcon className="h-4 w-4" />
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {company.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Company Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-500">Active Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">248</div>
                    <div className="text-sm text-gray-500">Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">1.2k</div>
                    <div className="text-sm text-gray-500">Profile Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">8</div>
                    <div className="text-sm text-gray-500">Team Members</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <BriefcaseIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New job posting published</p>
                      <p className="text-xs text-gray-500">Senior Software Engineer - 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New team member joined</p>
                      <p className="text-xs text-gray-500">Sarah Johnson - 1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                    <PlusIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Post New Job</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                    <UserGroupIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Invite Team Member</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
                    <ChartBarIcon className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">View Analytics</span>
                  </button>
                </div>
              </div>

              {/* Company Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Founded</span>
                    <span className="text-gray-900">2020</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Industry</span>
                    <span className="text-gray-900">{company?.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Company Size</span>
                    <span className="text-gray-900">{company?.company_size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Invite Member
              </button>
            </div>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.user?.full_name}</p>
                      <p className="text-sm text-gray-500">{member.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.status === 'active' ? 'bg-green-100 text-green-800' :
                      member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status}
                    </span>
                    <span className="text-sm text-gray-500 capitalize">{member.role.replace('_', ' ')}</span>
                    <button className="text-red-600 hover:text-red-800">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tab contents would go here */}
        {activeTab === 'branding' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Brand Management</h3>
            <p className="text-gray-500">Brand management features coming soon...</p>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Company Verification</h3>
            <p className="text-gray-500">Verification features coming soon...</p>
          </div>
        )}

        {activeTab === 'culture' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Company Culture</h3>
            <p className="text-gray-500">Culture showcase features coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfileDashboard;