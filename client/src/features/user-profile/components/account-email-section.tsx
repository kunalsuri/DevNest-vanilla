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
import { Edit3, Check, X, Mail } from "lucide-react";
import { useErrorHandler } from "@/hooks/use-error-handler";

const accountEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
});

type AccountEmailFormData = z.infer<typeof accountEmailSchema>;

export function AccountEmailSection() {
  const { user } = useJWTAuth();
  const { updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const { handleError } = useErrorHandler();

  const form = useForm<AccountEmailFormData>({
    resolver: zodResolver(accountEmailSchema),
    mode: 'onChange',
    defaultValues: {
      email: user?.email || "",
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    form.reset({
      email: user?.email || "",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset({
      email: user?.email || "",
    });
  };

  const onSubmit = async (data: AccountEmailFormData) => {
    try {
      await updateProfile.mutateAsync({
        email: data.email.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      handleError(error as Error, 'Email update failed');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">Account email</CardTitle>
        <p className="text-sm text-muted-foreground">Change your account email address.</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter new email address"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateProfile.isPending || !form.formState.isValid}
                      data-testid="button-save-email"
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
                      data-testid="button-cancel-email"
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
                  <p className="font-medium" data-testid="text-email">
                    {user?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your account email address
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEdit}
                  data-testid="button-edit-email"
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