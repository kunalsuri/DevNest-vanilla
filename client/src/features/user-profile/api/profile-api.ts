import { apiRequest } from "@/lib/queryClient";
import { UserProfile, ProfileUpdateData } from "../types";
import { AccountPreferences } from "@shared/schema";

export const profileApi = {
  // Get current user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiRequest("GET", "/api/profile");
    return response.json();
  },

  // Update profile information
  updateProfile: async (data: ProfileUpdateData): Promise<UserProfile> => {
    const response = await apiRequest("PUT", "/api/profile", data);
    return response.json();
  },

  // Upload profile picture
  uploadProfilePicture: async (
    file: File,
  ): Promise<{ profilePicture: string }> => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await fetch("/api/profile/upload-picture", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "Failed to upload profile picture";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Use default message if parsing fails
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Upload failed due to an unexpected error");
    }
  },

  // Get user preferences
  getPreferences: async (): Promise<AccountPreferences> => {
    const response = await apiRequest("GET", "/api/profile/preferences");
    return response.json();
  },

  // Update preferences
  updatePreferences: async (
    preferences: AccountPreferences,
  ): Promise<AccountPreferences> => {
    const response = await apiRequest(
      "PUT",
      "/api/profile/preferences",
      preferences,
    );
    return response.json();
  },

  // Delete account
  deleteAccount: async (): Promise<void> => {
    await apiRequest("DELETE", "/api/profile");
  },
};
