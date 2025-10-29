import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProfile } from "../hooks/use-profile";
import { useJWTAuth } from "@/features/auth";
import { Camera, Upload } from "lucide-react";
import { useErrorHandler } from "@/hooks/use-error-handler";

export function ProfilePictureSection() {
  const { user } = useJWTAuth();
  const { uploadProfilePicture } = useProfile();
  const [isUploading, setIsUploading] = useState(false);
  const { handleError } = useErrorHandler();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);
    try {
      await uploadProfilePicture.mutateAsync(file);
    } catch (error) {
      handleError(error as Error, "Profile picture upload failed");
    } finally {
      setIsUploading(false);
      // Clear the input
      event.target.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">
          Profile Picture
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a profile picture.
        </p>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={user?.profilePicture || undefined}
              alt={`${user?.firstName} ${user?.lastName}`}
            />
            <AvatarFallback className="text-xl bg-primary text-primary-foreground">
              {user ? getInitials(user.firstName, user.lastName) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 bg-background border-2 border-background rounded-full">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full"
              onClick={() =>
                document.getElementById("profile-picture-input")?.click()
              }
              disabled={isUploading}
              data-testid="button-edit-picture"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <Button
              variant="outline"
              className="w-fit"
              onClick={() =>
                document.getElementById("profile-picture-input")?.click()
              }
              disabled={isUploading}
              data-testid="button-upload-picture"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload picture"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Recommended: Square image, at least 200x200px. Max file size: 5MB.
          </p>
        </div>

        <Input
          id="profile-picture-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          data-testid="input-profile-picture"
        />
      </CardContent>
    </Card>
  );
}
