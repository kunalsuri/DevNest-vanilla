import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useJWTAuth } from "@/features/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Code2,
  Rocket,
  Github,
  Mail,
  Key,
  ShieldCheck,
  User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const passwordResetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>;
type PasswordResetConfirmData = z.infer<typeof passwordResetConfirmSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useJWTAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [resetView, setResetView] = useState<"request" | "confirm" | null>(
    null,
  );
  const { toast } = useToast();

  // Check for reset token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get("reset-token");
    if (resetToken) {
      setResetView("confirm");
      passwordResetConfirmForm.setValue("token", resetToken);
    }
  }, []);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const passwordResetRequestForm = useForm<PasswordResetRequestData>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const passwordResetConfirmForm = useForm<PasswordResetConfirmData>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: {
      token: "",
      password: "",
    },
  });

  // Password reset mutations
  const passwordResetRequestMutation = useMutation({
    mutationFn: async (data: PasswordResetRequestData) => {
      const res = await apiRequest(
        "POST",
        "/api/auth/password-reset/request",
        data,
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset email sent",
        description:
          "If your email is registered, you will receive reset instructions.",
      });
      setResetView(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    },
  });

  const passwordResetConfirmMutation = useMutation({
    mutationFn: async (data: PasswordResetConfirmData) => {
      const res = await apiRequest(
        "POST",
        "/api/auth/password-reset/confirm",
        data,
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. Please sign in.",
      });
      setResetView(null);
      setActiveTab("login");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const onLogin = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
      setLocation("/");
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  /** Quick-fill and submit as the admin account (dev/test helper) */
  const onAdminSignIn = async () => {
    loginForm.setValue("username", "admin");
    loginForm.setValue("password", "Admin123!");
    try {
      await loginMutation.mutateAsync({
        username: "admin",
        password: "Admin123!",
      });
      setLocation("/admin/users");
    } catch {
      // If admin credentials differ, surface the toast from the mutation
    }
  };

  /** Quick-fill and submit as a regular user account (dev/test helper) */
  const onUserSignIn = async () => {
    loginForm.setValue("username", "lucas.anderson"); // matches data/users.json seeded user
    loginForm.setValue("password", "SncfDemo2026!");
    try {
      await loginMutation.mutateAsync({
        username: "lucas.anderson",
        password: "SncfDemo2026!",
      });
      setLocation("/dashboard");
    } catch {
      // Error surfaced by mutation onError toast
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync(data);
      setLocation("/");
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  const onPasswordResetRequest = async (data: PasswordResetRequestData) => {
    try {
      await passwordResetRequestMutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  const onPasswordResetConfirm = async (data: PasswordResetConfirmData) => {
    try {
      await passwordResetConfirmMutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/">
              <Button
                variant="ghost"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Button>
            </Link>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Code2 className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">DevNest</span>
            </div>
          </div>

          {/* Password Reset Forms */}
          {resetView === "request" && (
            <Card>
              <CardHeader className="text-center">
                <Mail className="w-8 h-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-2xl">Reset your password</CardTitle>
                <CardDescription>
                  Enter your email to receive reset instructions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordResetRequestForm}>
                  <form
                    onSubmit={passwordResetRequestForm.handleSubmit(
                      onPasswordResetRequest,
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={passwordResetRequestForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              {...field}
                              data-testid="input-reset-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={passwordResetRequestMutation.isPending}
                      data-testid="button-send-reset"
                    >
                      {passwordResetRequestMutation.isPending
                        ? "Sending..."
                        : "Send reset email"}
                    </Button>
                  </form>
                </Form>
                <div className="mt-4 text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm"
                    onClick={() => setResetView(null)}
                    data-testid="link-back-to-login"
                  >
                    Back to sign in
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {resetView === "confirm" && (
            <Card>
              <CardHeader className="text-center">
                <Key className="w-8 h-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-2xl">Set new password</CardTitle>
                <CardDescription>Enter your new password below</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordResetConfirmForm}>
                  <form
                    onSubmit={passwordResetConfirmForm.handleSubmit(
                      onPasswordResetConfirm,
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={passwordResetConfirmForm.control}
                      name="token"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input type="hidden" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordResetConfirmForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your new password"
                              {...field}
                              data-testid="input-new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={passwordResetConfirmMutation.isPending}
                      data-testid="button-reset-password"
                    >
                      {passwordResetConfirmMutation.isPending
                        ? "Resetting..."
                        : "Reset password"}
                    </Button>
                  </form>
                </Form>
                <div className="mt-4 text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm"
                    onClick={() => setResetView(null)}
                    data-testid="link-back-from-confirm"
                  >
                    Back to sign in
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!resetView && (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="tab-login">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome back</CardTitle>
                    <CardDescription>Sign in to your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form
                        onSubmit={loginForm.handleSubmit(onLogin)}
                        className="space-y-4"
                      >
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your username"
                                  {...field}
                                  data-testid="input-username"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>Password</FormLabel>
                                <Button
                                  type="button"
                                  variant="link"
                                  className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
                                  onClick={() => setResetView("request")}
                                  data-testid="link-forgot-password"
                                >
                                  Forgot password?
                                </Button>
                              </div>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Enter your password"
                                  {...field}
                                  data-testid="input-password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending}
                          data-testid="button-login"
                        >
                          {loginMutation.isPending
                            ? "Signing in..."
                            : "Sign in"}
                        </Button>
                      </form>
                    </Form>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-background text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid="button-github-login"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </Button>

                    {/* Dev / tester quick-access — only visible in development */}
                    {import.meta.env.DEV && (
                      <div className="mt-3">
                        <div className="relative mb-3">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-dashed border-border"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-background text-muted-foreground">
                              Testing shortcuts
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full gap-2"
                            onClick={onUserSignIn}
                            disabled={loginMutation.isPending}
                            data-testid="button-user-signin"
                          >
                            <User className="w-4 h-4" />
                            User Sign In
                            <Badge
                              variant="outline"
                              className="ml-auto text-xs font-normal"
                            >
                              user
                            </Badge>
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full gap-2"
                            onClick={onAdminSignIn}
                            disabled={loginMutation.isPending}
                            data-testid="button-admin-signin"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Admin Sign In
                            <Badge
                              variant="outline"
                              className="ml-auto text-xs font-normal"
                            >
                              admin
                            </Badge>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">
                      Create your account
                    </CardTitle>
                    <CardDescription>
                      Start building amazing applications today
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form
                        onSubmit={registerForm.handleSubmit(onRegister)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="John"
                                    {...field}
                                    data-testid="input-first-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Doe"
                                    {...field}
                                    data-testid="input-last-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="johndoe"
                                  {...field}
                                  data-testid="input-signup-username"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email address</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="john@example.com"
                                  {...field}
                                  data-testid="input-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Create a strong password"
                                  {...field}
                                  data-testid="input-signup-password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={registerMutation.isPending}
                          data-testid="button-register"
                        >
                          {registerMutation.isPending
                            ? "Creating account..."
                            : "Create account"}
                        </Button>
                      </form>
                    </Form>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-background text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid="button-github-register"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary flex items-center justify-center">
          {/* Decorative circles */}
          <div className="absolute top-16 right-16 w-32 h-32 rounded-full bg-white/5 blur-xl" />
          <div className="absolute bottom-24 left-16 w-48 h-48 rounded-full bg-white/5 blur-2xl" />

          <div className="relative text-center text-white space-y-6 max-w-md mx-auto px-8">
            {activeTab === "login" ? (
              <>
                <Code2 className="w-16 h-16 mx-auto opacity-90" />
                <h3 className="text-3xl font-bold">Welcome to DevNest</h3>
                <p className="text-white/80 text-base leading-relaxed">
                  Your full-stack launchpad. Sign in to access your dashboard,
                  manage projects, and ship faster.
                </p>
                <div className="pt-4 space-y-3 text-left">
                  {[
                    "JWT authentication & refresh tokens",
                    "Role-based access control (RBAC)",
                    "Real-time observability & logging",
                    "Production-grade security headers",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-white/90">{feature}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <Rocket className="w-16 h-16 mx-auto opacity-90" />
                <h3 className="text-3xl font-bold">Build something great</h3>
                <p className="text-white/80 text-base leading-relaxed">
                  Join DevNest and start building your next project with a
                  battle-tested monorepo template.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">5 min</div>
                    <div className="text-sm text-white/80 mt-1">To go live</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">100%</div>
                    <div className="text-sm text-white/80 mt-1">TypeScript</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">30+</div>
                    <div className="text-sm text-white/80 mt-1">
                      UI Components
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
