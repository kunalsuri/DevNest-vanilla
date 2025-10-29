// client/src/features/auth/hooks/use-jwt-auth.tsx
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { PublicUser, JWTRegisterData, JWTLoginData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import {
  setAccessToken,
  clearAccessToken,
  isAuthenticated,
  authenticatedFetch,
  handleApiResponse,
  tryRefreshToken,
  startTokenRefreshTimer,
  getUserFromToken,
} from "../utils/jwt-auth-utils";

interface AuthResponse {
  user: PublicUser;
  accessToken: string;
  csrfToken: string;
}

interface AuthContextType {
  user: PublicUser | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<AuthResponse, Error, JWTLoginData>;
  registerMutation: UseMutationResult<AuthResponse, Error, JWTRegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  refreshTokenMutation: UseMutationResult<AuthResponse, Error, void>;
  hasRole: (role: string) => boolean;
}

export const JWTAuthContext = createContext<AuthContextType | null>(null);

export function JWTAuthProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Check if we have a valid token on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Always try to refresh token on startup (in case we have a refresh token cookie)
      const refreshed = await tryRefreshToken();
      if (!refreshed) {
        clearAccessToken();
      }
      setIsAuthChecked(true);
    };

    checkAuth();

    // Start automatic token refresh
    startTokenRefreshTimer();
  }, []);

  // Get current user from token or API
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<PublicUser | null, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!isAuthenticated()) {
        return null;
      }

      // First try to get user from token
      const tokenUser = getUserFromToken();
      if (tokenUser) {
        // Try to get full user data from API to ensure we have complete profile
        try {
          const response = await authenticatedFetch("/api/auth/user");
          return handleApiResponse<PublicUser>(response);
        } catch (error) {
          // If API call fails, fall back to token data
          console.warn("API call failed, using token data:", error);
          const user: PublicUser = {
            id: tokenUser.userId,
            username: tokenUser.username,
            email: tokenUser.email,
            role: tokenUser.role,
            firstName: tokenUser.firstName || "",
            lastName: tokenUser.lastName || "",
            profilePicture: null,
            createdAt: null,
          };
          return user;
        }
      }

      // No token user, try API call
      try {
        const response = await authenticatedFetch("/api/auth/user");
        return handleApiResponse<PublicUser>(response);
      } catch (error) {
        // If API call fails, clear auth state
        console.error("Failed to fetch user from API:", error);
        clearAccessToken();
        return null;
      }
    },
    enabled: isAuthChecked,
    retry: false, // Don't retry on auth failures
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: JWTLoginData): Promise<AuthResponse> => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      return response.json();
    },
    onSuccess: (data: AuthResponse) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(["/api/auth/user"], data.user);

      // Set user context for logging
      logger.setUserId(data.user.id);

      // Log successful login
      logger.info(
        "User login successful",
        {
          userId: data.user.id,
          username: data.user.username,
        },
        "auth",
      );

      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${data.user.firstName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: JWTRegisterData): Promise<AuthResponse> => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      return response.json();
    },
    onSuccess: (data: AuthResponse) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(["/api/auth/user"], data.user);

      // Set user context for logging
      logger.setUserId(data.user.id);

      // Log successful registration
      logger.info(
        "User registration successful",
        {
          userId: data.user.id,
          username: data.user.username,
        },
        "auth",
      );

      toast({
        title: "Account created!",
        description: `Welcome to DevNest, ${data.user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await authenticatedFetch("/api/auth/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      clearAccessToken();
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear(); // Clear all cached data

      // Log successful logout and clear user context
      logger.info("User logout successful", {}, "auth");
      logger.clearContext();

      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      // Even if logout fails on server, clear client state
      clearAccessToken();
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      logger.clearContext();

      toast({
        title: "Logged out",
        description: "You have been logged out",
      });
    },
  });

  const refreshTokenMutation = useMutation({
    mutationFn: async (): Promise<AuthResponse> => {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Token refresh failed");
      }

      return response.json();
    },
    onSuccess: (data: AuthResponse) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(["/api/auth/user"], data.user);
    },
    onError: () => {
      clearAccessToken();
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  const hasRole = (role: string): boolean => {
    if (!user) {
      return false;
    }
    return user.role === role;
  };

  const contextValue = useMemo(
    () => ({
      user: user ?? null,
      isLoading: !isAuthChecked || isLoading,
      error,
      isAuthenticated: isAuthenticated() && !!user,
      loginMutation,
      registerMutation,
      logoutMutation,
      refreshTokenMutation,
      hasRole,
    }),
    [
      user,
      isAuthChecked,
      isLoading,
      error,
      loginMutation,
      registerMutation,
      logoutMutation,
      refreshTokenMutation,
    ],
  );

  return (
    <JWTAuthContext.Provider value={contextValue}>
      {children}
    </JWTAuthContext.Provider>
  );
}

export function useJWTAuth() {
  const context = useContext(JWTAuthContext);
  if (!context) {
    throw new Error("useJWTAuth must be used within a JWTAuthProvider");
  }
  return context;
}
