import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../api/profile-api";
import { ProfileUpdateData } from "../types";
import { useToast } from "@/hooks/use-toast";

export function useProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["/api/profile"],
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateProfile = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["/api/profile"], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadProfilePicture = useMutation({
    mutationFn: profileApi.uploadProfilePicture,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: profileApi.deleteAccount,
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    profile: profile.data,
    isLoading: profile.isLoading,
    error: profile.error,
    updateProfile,
    uploadProfilePicture,
    deleteAccount,
  };
}

export function usePreferences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const preferences = useQuery({
    queryKey: ["/api/profile/preferences"],
    queryFn: profileApi.getPreferences,
    retry: 1,
    retryDelay: 1000,
  });

  const updatePreferences = useMutation({
    mutationFn: profileApi.updatePreferences,
    onSuccess: (updatedPreferences) => {
      queryClient.setQueryData(["/api/profile/preferences"], updatedPreferences);
      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  return {
    preferences: preferences.data,
    isLoading: preferences.isLoading,
    error: preferences.error,
    updatePreferences,
  };
}