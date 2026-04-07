import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useProfile } from "../hooks/use-profile";
import { useJWTAuth } from "@/features/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit3, Check, X, Briefcase } from "lucide-react";
import { useErrorHandler } from "@/hooks/use-error-handler";

const professionalInfoSchema = z.object({
  age: z.coerce.number().int().min(1).max(120).optional().nullable(),
  officeLocation: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
});

type ProfessionalInfoFormData = z.infer<typeof professionalInfoSchema>;

export function ProfessionalInfoSection() {
  const { user } = useJWTAuth();
  const { updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const { handleError } = useErrorHandler();

  const extendedUser = user as typeof user & {
    age?: number | null;
    officeLocation?: string | null;
    position?: string | null;
    department?: string | null;
    phone?: string | null;
  };

  const defaultValues: ProfessionalInfoFormData = {
    age: extendedUser?.age ?? null,
    officeLocation: extendedUser?.officeLocation ?? "",
    position: extendedUser?.position ?? "",
    department: extendedUser?.department ?? "",
    phone: extendedUser?.phone ?? "",
  };

  const form = useForm<ProfessionalInfoFormData>({
    resolver: zodResolver(professionalInfoSchema),
    mode: "onChange",
    defaultValues,
  });

  const handleEdit = () => {
    setIsEditing(true);
    form.reset({
      age: extendedUser?.age ?? null,
      officeLocation: extendedUser?.officeLocation ?? "",
      position: extendedUser?.position ?? "",
      department: extendedUser?.department ?? "",
      phone: extendedUser?.phone ?? "",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset(defaultValues);
  };

  const onSubmit = async (data: ProfessionalInfoFormData) => {
    try {
      await updateProfile.mutateAsync({
        age: data.age ?? null,
        officeLocation: data.officeLocation || null,
        position: data.position || null,
        department: data.department || null,
        phone: data.phone || null,
      });
      setIsEditing(false);
    } catch (error) {
      handleError(error as Error, "Professional info update failed");
    }
  };

  const infoRows: Array<{ label: string; key: keyof typeof extendedUser }> = [
    { label: "Position / Title", key: "position" },
    { label: "Department", key: "department" },
    { label: "Location / City", key: "officeLocation" },
    { label: "Phone", key: "phone" },
    { label: "Age", key: "age" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary">
          Professional Info
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your work details and contact information.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted mt-1 shrink-0">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1">
            {isEditing ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position / Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Senior Engineer"
                              data-testid="input-position"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Engineering"
                              data-testid="input-department"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="officeLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location / City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Berlin, Germany"
                              data-testid="input-office-location"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. +1 555 000 1234"
                              data-testid="input-phone"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={120}
                              placeholder="e.g. 30"
                              data-testid="input-age"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                                )
                              }
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
                      disabled={
                        updateProfile.isPending || !form.formState.isValid
                      }
                      data-testid="button-save-professional-info"
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
                      data-testid="button-cancel-professional-info"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="flex items-start justify-between">
                <dl className="space-y-1 text-sm">
                  {infoRows.map(({ label, key }) => {
                    const value = extendedUser?.[key];
                    return (
                      <div key={key} className="flex gap-2">
                        <dt className="text-muted-foreground w-36 shrink-0">
                          {label}:
                        </dt>
                        <dd className="font-medium" data-testid={`text-${key}`}>
                          {value !== null &&
                          value !== undefined &&
                          value !== "" ? (
                            String(value)
                          ) : (
                            <span className="text-muted-foreground italic">
                              Not set
                            </span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEdit}
                  data-testid="button-edit-professional-info"
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
