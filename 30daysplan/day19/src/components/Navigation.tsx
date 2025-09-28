/**
 * Navigation Component
 * Provides consistent navigation across all pages with authentication support
 */
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { DocumentTextIcon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

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
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <nav className={`bg-white shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">{t('common.appName')}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                to="/builder" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/builder') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {t('navigation.resumeBuilder')}
              </Link>
              <Link 
                to="/update-resume" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/update-resume') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {t('navigation.uploadResume')}
              </Link>
              <Link 
                to="/analyzer" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/analyzer') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {t('navigation.resumeAnalyzer')}
              </Link>
              <Link 
                to="/templates" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/templates') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {t('navigation.templates')}
              </Link>
              <Link 
                to="/cover-letter" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/cover-letter') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {t('navigation.coverLetter')}
              </Link>
              
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
              type="button"
              className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - You can expand this later with state management */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
          <Link 
            to="/builder" 
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
              isActive('/builder') 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            {t('navigation.resumeBuilder')}
          </Link>
          <Link 
            to="/update-resume" 
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
              isActive('/update-resume') 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            {t('navigation.uploadResume')}
          </Link>
          <Link 
            to="/analyzer" 
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
              isActive('/analyzer') 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            {t('navigation.resumeAnalyzer')}
          </Link>
          <Link 
            to="/templates" 
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
              isActive('/templates') 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            {t('navigation.templates')}
          </Link>
          <Link 
            to="/cover-letter" 
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
              isActive('/cover-letter') 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            {t('navigation.coverLetter')}
          </Link>
          
          {user ? (
            <div className="border-t border-gray-200 pt-4 mt-4">

              <div className="px-3 py-2 text-sm text-gray-700">
                Welcome, {user.name}
              </div>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
              <Link 
                to="/login" 
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
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;