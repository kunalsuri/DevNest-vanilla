import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useProfile } from "../hooks/use-profile";
import { useJWTAuth } from "@/features/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit3, Check, X, User } from "lucide-react";
import { useErrorHandler } from "@/hooks/use-error-handler";

const profileNameSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be less than 50 characters"),
});

type ProfileNameFormData = z.infer<typeof profileNameSchema>;

export function ProfileNameSection() {
  const { user } = useJWTAuth();
  const { updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const { handleError } = useErrorHandler();

  const form = useForm<ProfileNameFormData>({
    resolver: zodResolver(profileNameSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    form.reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    });
  };

  const onSubmit = async (data: ProfileNameFormData) => {
    try {
      await updateProfile.mutateAsync({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      handleError(error as Error, 'Profile name update failed');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">Profile Name</CardTitle>
        <p className="text-sm text-muted-foreground">Change your profile name.</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="First name"
                              data-testid="input-first-name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Last name"
                              data-testid="input-last-name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateProfile.isPending || !form.formState.isValid}
                      data-testid="button-save-name"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {updateProfile.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={updateProfile.isPending}
                      data-testid="button-cancel-name"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" data-testid="text-full-name">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your display name
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEdit}
                  data-testid="button-edit-name"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}