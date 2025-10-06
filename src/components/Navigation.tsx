/**
 * Navigation Component
 * Provides consistent navigation across all pages with authentication support
 * Updated with role-based 3-section structure: Jobs Hub, My Dashboard, AI Assistant
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useRoleManagement } from '../hooks/useRoleManagement';
import { 
  DocumentTextIcon, 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  ChartBarIcon,
  SparklesIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { isFeatureEnabled } from '../config/featureFlags';
import ComingSoon from './ComingSoon';

// Safe hook to handle context outside provider
const useSafeSupabaseAuth = () => {
  try {
    return useSupabaseAuth();
  } catch (error) {
    console.warn('Navigation: SupabaseAuth context not available, using fallback');
    return {
      user: null,
      logout: async () => {
        console.warn('Logout called outside auth context');
        // Force page reload to clear any cached state
        window.location.href = '/login';
      },
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      isEmailVerified: false
    };
  }
};

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { user, logout } = useSafeSupabaseAuth();
  const { userRole, permissions, canAccessFeature } = useRoleManagement();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to login page after successful logout
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear and navigate to login even if logout fails
      navigate('/login', { replace: true });
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isActiveGroup = (paths: string[]) => {
    return paths.some(path => location.pathname.startsWith(path));
  };

  // Define navigation sections based on optimized architecture
  const getNavigationSections = () => {
    const sections = [];

    // Jobs Hub - Coming Soon Features
    const jobsHubItems = [
      { 
        label: 'Browse Jobs', 
        path: '/jobs-hub?view=browse', 
        visible: canAccessFeature('canBrowseJobs'),
        disabled: !isFeatureEnabled('browseJobs'),
        comingSoon: !isFeatureEnabled('browseJobs')
      },
      { 
        label: 'Saved Jobs', 
        path: '/jobs-hub?view=saved', 
        visible: canAccessFeature('canSaveJobs'),
        disabled: !isFeatureEnabled('savedJobs'),
        comingSoon: !isFeatureEnabled('savedJobs')
      },
      { 
        label: 'Post Job', 
        path: '/jobs-hub?view=post', 
        visible: canAccessFeature('canPostJobs'),
        isSpecial: true, // Mark as special for styling
        disabled: !isFeatureEnabled('employerDashboard'),
        comingSoon: !isFeatureEnabled('employerDashboard')
      },
      { 
        label: 'Manage Jobs', 
        path: '/jobs-hub?view=manage', 
        visible: canAccessFeature('canPostJobs'),
        disabled: !isFeatureEnabled('employerDashboard'),
        comingSoon: !isFeatureEnabled('employerDashboard')
      }
    ].filter(item => item.visible);

    sections.push({
      id: 'jobs-hub',
      label: 'Jobs Hub',
      icon: BriefcaseIcon,
      path: '/jobs-hub',
      isActive: isActiveGroup(['/jobs-hub', '/jobs', '/post-job', '/saved-jobs']),
      subItems: jobsHubItems
    });

    // My Dashboard - Coming Soon Features
    if (user) {
      sections.push({
        id: 'dashboard',
        label: 'My Dashboard',
        icon: ChartBarIcon,
        path: '/dashboard',
        isActive: isActiveGroup(['/dashboard', '/employer-dashboard', '/applicant-dashboard', '/profile']),
        subItems: [
          { 
            label: 'Overview', 
            path: '/dashboard', 
            visible: true,
            disabled: !isFeatureEnabled('jobSeekerOverview'),
            comingSoon: !isFeatureEnabled('jobSeekerOverview')
          },
          { 
            label: 'Applications', 
            path: '/dashboard/applications', 
            visible: userRole === 'job_seeker' || userRole === 'dual',
            disabled: !isFeatureEnabled('jobSeekerApplications'),
            comingSoon: !isFeatureEnabled('jobSeekerApplications')
          },
          { 
            label: 'Posted Jobs', 
            path: '/dashboard/jobs', 
            visible: userRole === 'employer' || userRole === 'dual',
            disabled: !isFeatureEnabled('employerDashboard'),
            comingSoon: !isFeatureEnabled('employerDashboard')
          },
          { 
            label: 'Analytics', 
            path: '/dashboard/analytics', 
            visible: canAccessFeature('canViewAnalytics'),
            disabled: !isFeatureEnabled('employerDashboard'),
            comingSoon: !isFeatureEnabled('employerDashboard')
          },
          { 
            label: 'Profile', 
            path: '/dashboard/profile', 
            visible: true,
            disabled: !isFeatureEnabled('jobSeekerProfile'),
            comingSoon: !isFeatureEnabled('jobSeekerProfile')
          }
        ].filter(item => item.visible)
      });
    }

    // AI Assistant - Core features only (no role-based restrictions)
    const getAIAssistantItems = () => {
      return [
        { label: 'Resume Builder', path: '/builder', visible: true },
        { label: 'Resume Analyzer', path: '/analyzer', visible: true },
        { label: 'Upwork Proposal', path: '/upwork-proposal', visible: true },
        { label: 'AI Chat', path: '/ai-assistant', visible: true },
        { label: 'Templates', path: '/templates', visible: true }
      ];
    };

    sections.push({
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: SparklesIcon,
      path: '/ai-assistant',
      isActive: isActiveGroup(['/ai-assistant', '/builder', '/analyzer', '/upwork-proposal']),
      subItems: getAIAssistantItems().filter(item => item.visible)
    });

    return sections;
  };

  const navigationSections = getNavigationSections();

  return (
    <nav ref={navRef} className={`bg-white shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">{t('common.appName')}</span>
            </Link>
          </div>

          {/* Desktop Navigation - 3 Main Sections */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationSections.map((section) => (
                <div key={section.id} className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === section.id ? null : section.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      section.isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <section.icon className="h-4 w-4 mr-1" />
                    {section.label}
                    <ChevronDownIcon className="h-3 w-3 ml-1" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeDropdown === section.id && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        {section.subItems.map((item) => (
                          <div key={item.path} className="relative">
                            <Link
                              to={item.disabled ? '#' : item.path}
                              onClick={(e) => {
                                if (item.disabled) {
                                  e.preventDefault();
                                  return;
                                }
                                setActiveDropdown(null);
                              }}
                              className={`block px-4 py-2 text-sm transition-colors ${
                                item.isSpecial 
                                  ? 'text-white bg-blue-600 hover:bg-blue-700 font-medium' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              } ${item.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {item.isSpecial && <Plus className="h-4 w-4 inline mr-2" />}
                              {item.label}
                              {item.comingSoon && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Soon
                                </span>
                              )}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              
              {/* Language Selector */}
              <LanguageSelector />
              
              {/* Authentication */}
              {user ? (
                <div className="flex items-center space-x-4 ml-4">

                  
                  {/* User Menu */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <UserIcon className="h-4 w-4" />
                      <span>{user.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 ml-4">
                  <Link 
                    to="/login" 
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/login') 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationSections.map((section) => (
              <div key={section.id} className="space-y-1">
                <div className="px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-50 rounded-md">
                  <section.icon className="h-4 w-4 inline mr-2" />
                  {section.label}
                </div>
                {section.subItems.map((item) => (
                  <div key={item.path} className="relative">
                    <Link
                      to={item.disabled ? '#' : item.path}
                      onClick={(e) => {
                        if (item.disabled) {
                          e.preventDefault();
                          return;
                        }
                        setIsMobileMenuOpen(false);
                      }}
                      className={`${
                        item.isSpecial
                          ? 'bg-blue-600 text-white hover:bg-blue-700 font-medium'
                          : isActive(item.path)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      } ${item.disabled ? 'opacity-60 cursor-not-allowed' : ''} block px-6 py-2 rounded-md text-base font-medium ml-4 flex items-center justify-between`}
                    >
                      <div className="flex items-center">
                        {item.isSpecial && <Plus className="h-4 w-4 mr-2" />}
                        {item.label}
                      </div>
                      {item.comingSoon && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Soon
                        </span>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            ))}
            
            {/* Authentication section for mobile */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-700">
                    Welcome, {user.name}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link 
                    to="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive('/login') 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;