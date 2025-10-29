// client/src/features/auth/utils/jwt-auth-utils.ts

/**
 * JWT Authentication Utilities
 * Handles token storage, CSRF token management, and API request authentication
 */

let accessToken: string | null = null;

/**
 * Set access token in memory
 */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Get access token from memory
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Clear access token from memory
 */
export function clearAccessToken(): void {
  accessToken = null;
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFToken(): string | null {
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrfToken='));
  
  if (!csrfCookie) {
    return null;
  }
  
  return csrfCookie.split('=')[1]?.trim() || null;
}

/**
 * Check if user is authenticated (has access token)
 */
export function isAuthenticated(): boolean {
  return accessToken !== null;
}

/**
 * Create authenticated API request headers
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add access token if available
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  // Add CSRF token for state-changing requests
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
}

/**
 * Make authenticated API request
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for refresh token
  });
}

/**
 * Handle API response errors (including token refresh)
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json();
  }

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry the original request
      return response.json();
    }
  }

  // Parse error response
  let errorData;
  try {
    errorData = await response.json();
  } catch {
    errorData = { message: 'Network error', code: 'NETWORK_ERROR' };
  }

  throw new Error(errorData.message || `HTTP ${response.status}`);
}

/**
 * Try to refresh access token using refresh token cookie
 */
export async function tryRefreshToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      setAccessToken(data.accessToken);
      return true;
    }

    // If 401, it means no valid refresh token - this is normal for first visits or server restarts
    // Server should have cleared cookies already, but ensure local state is cleared
    if (response.status === 401) {
      clearAccessToken();
      return false;
    }

    // Other errors - log them and clear state
    console.error('Token refresh failed with status:', response.status);
    clearAccessToken();
    return false;
  } catch (error) {
    // Network errors or other issues - log significant errors and clear state
    if (error instanceof Error && error.message !== 'Failed to fetch') {
      console.error('Token refresh error:', error.message);
    }
    clearAccessToken();
    return false;
  }
}

/**
 * Auto-refresh token before it expires
 */
export function startTokenRefreshTimer(): void {
  // Refresh token every 14 minutes (access token expires in 15 minutes)
  const refreshInterval = 14 * 60 * 1000;
  
  setInterval(async () => {
    if (isAuthenticated()) {
      await tryRefreshToken();
    }
  }, refreshInterval);
}

/**
 * Extract token payload (without verification - for client-side use only)
 */
export function decodeTokenPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token is expired (client-side check only)
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Get user info from access token (client-side only)
 */
export function getUserFromToken(): any {
  if (!accessToken) {
    return null;
  }
  
  return decodeTokenPayload(accessToken);
}