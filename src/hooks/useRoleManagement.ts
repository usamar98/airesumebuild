/**
 * Role Management Hook
 * Handles user role detection, permissions, and role-based feature access
 */
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { UserRole, RolePermissions, NavigationItem } from '../types';

interface RoleManagementState {
  userRole: UserRole;
  permissions: RolePermissions;
  isLoading: boolean;
  error: string | null;
}

export const useRoleManagement = () => {
  const { user, isAuthenticated } = useSupabaseAuth();
  const [state, setState] = useState<RoleManagementState>({
    userRole: 'job_seeker',
    permissions: getDefaultPermissions('job_seeker'),
    isLoading: true,
    error: null
  });

  // Detect user role based on user data and activity
  const detectUserRole = useCallback(async (): Promise<UserRole> => {
    if (!user || !isAuthenticated) {
      return 'job_seeker';
    }

    // Check if user has explicitly set a role
    if (user.user_role) {
      return user.user_role;
    }

    // Auto-detect based on user activity (simplified logic)
    try {
      // Check if user has posted jobs (employer activity)
      const hasPostedJobs = await checkUserActivity('posted_jobs');
      
      // Check if user has saved jobs (job seeker activity)
      const hasSavedJobs = await checkUserActivity('saved_jobs');
      
      if (hasPostedJobs && hasSavedJobs) {
        return 'dual';
      } else if (hasPostedJobs) {
        return 'employer';
      } else {
        return 'job_seeker';
      }
    } catch (error) {
      console.error('Error detecting user role:', error);
      return 'job_seeker'; // Default fallback
    }
  }, [user, isAuthenticated]);

  // Update user role
  const updateUserRole = useCallback(async (newRole: UserRole, preferences?: any) => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Update role in backend (placeholder - implement actual API call)
      await updateUserRoleInBackend(user.id, newRole, preferences);
      
      // Update local state
      setState(prev => ({
        ...prev,
        userRole: newRole,
        permissions: getPermissions(newRole),
        isLoading: false
      }));

      // Store in localStorage for quick access
      localStorage.setItem('userRole', newRole);
      if (preferences) {
        localStorage.setItem('rolePreferences', JSON.stringify(preferences));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to update user role',
        isLoading: false
      }));
    }
  }, [user]);

  // Get role-based navigation items
  const getVisibleNavigationItems = useCallback((allItems: NavigationItem[]): NavigationItem[] => {
    return allItems.filter(item => 
      item.roles.includes(state.userRole) || item.roles.includes('dual')
    );
  }, [state.userRole]);

  // Check if user can access a specific feature
  const canAccessFeature = useCallback((feature: keyof RolePermissions): boolean => {
    return state.permissions[feature];
  }, [state.permissions]);

  // Initialize role detection
  useEffect(() => {
    const initializeRole = async () => {
      if (!isAuthenticated) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check localStorage first for quick load
      const cachedRole = localStorage.getItem('userRole') as UserRole;
      if (cachedRole && ['job_seeker', 'employer', 'dual'].includes(cachedRole)) {
        setState(prev => ({
          ...prev,
          userRole: cachedRole,
          permissions: getPermissions(cachedRole),
          isLoading: false
        }));
      }

      // Detect actual role from backend
      try {
        const detectedRole = await detectUserRole();
        setState(prev => ({
          ...prev,
          userRole: detectedRole,
          permissions: getPermissions(detectedRole),
          isLoading: false
        }));

        // Update cache
        localStorage.setItem('userRole', detectedRole);
      } catch (error) {
        console.error('Error initializing role:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to detect user role',
          isLoading: false
        }));
      }
    };

    initializeRole();
  }, [isAuthenticated, detectUserRole]);

  return {
    userRole: state.userRole,
    permissions: state.permissions,
    isLoading: state.isLoading,
    error: state.error,
    updateUserRole,
    getVisibleNavigationItems,
    canAccessFeature,
    detectUserRole
  };
};

// Helper functions
function getDefaultPermissions(role: UserRole): RolePermissions {
  return getPermissions(role);
}

function getPermissions(role: UserRole): RolePermissions {
  const basePermissions: RolePermissions = {
    canBrowseJobs: false,
    canPostJobs: false,
    canSaveJobs: false,
    canManageApplications: false,
    canViewAnalytics: false,
    canAccessAITools: false
  };

  switch (role) {
    case 'job_seeker':
      return {
        ...basePermissions,
        canBrowseJobs: true,
        canSaveJobs: true,
        canAccessAITools: true
        // canPostJobs: false - job seekers should NOT post jobs
        // canManageApplications: false - job seekers don't manage applications
      };
    
    case 'employer':
      return {
        ...basePermissions,
        canPostJobs: true,
        canManageApplications: true,
        canViewAnalytics: true,
        canAccessAITools: true
        // canBrowseJobs: false - employers don't browse jobs, they post them
        // canSaveJobs: false - employers don't save jobs, they hire people
      };
    
    case 'dual':
      return {
        canBrowseJobs: true,
        canPostJobs: true,
        canSaveJobs: true,
        canManageApplications: true,
        canViewAnalytics: true,
        canAccessAITools: true
      };
    
    default:
      return basePermissions;
  }
}

// Placeholder functions - implement actual API calls
async function checkUserActivity(activityType: string): Promise<boolean> {
  // TODO: Implement actual API calls to check user activity
  // For now, return false as default
  return false;
}

async function updateUserRoleInBackend(userId: string, role: UserRole, preferences?: any): Promise<void> {
  // TODO: Implement actual API call to update user role
  console.log('Updating user role:', { userId, role, preferences });
}

export default useRoleManagement;