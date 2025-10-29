/**
 * Admin Access Hook
 * 
 * Provides utilities for checking admin permissions and role-based access
 */

import { useJWTAuth } from '@/features/auth';

export function useAdminAccess() {
  const { user } = useJWTAuth();
  
  const isAdmin = user?.role === 'admin';
  const hasObservabilityAccess = isAdmin; // Can be extended for more granular permissions
  
  return {
    isAdmin,
    hasObservabilityAccess,
    user,
  };
}