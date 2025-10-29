import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useJWTAuth } from "@/features/auth";
import { useEffect } from "react";
import {
  Code,
  Rocket,
  Github,
  FolderTree,
  ShieldCheck,
  Palette,
  Database,
  Smartphone,
  Zap,
  Folder,
  Globe,
  Server,
  Package,
  User,
  Component,
  Twitter,
  BookOpen,
} from "lucide-react";

export default function LandingPage() {
  const { user, isLoading } = useJWTAuth();
  const [, navigate] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Code className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold">DevNest</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#architecture" className="text-muted-foreground hover:text-foreground transition-colors">
                Architecture
              </a>
              <a href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </a>
              <a href="https://github.com/devnest" className="text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm" data-testid="button-dashboard">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth">
                    <Button variant="ghost" size="sm" data-testid="button-sign-in">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button size="sm" data-testid="button-get-started">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
                <span className="block">Full-Stack Monorepo</span>
                <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Template for Modern Apps
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                A production-ready React + TypeScript + Express template with authentication,
                dark mode, and modular architecture. Perfect for rapid prototyping and team collaboration.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="inline-flex items-center gap-2" data-testid="button-start-building">
                  <Rocket className="w-5 h-5" />
                  Start Building
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="inline-flex items-center gap-2" data-testid="button-github">
                <Github className="w-5 h-5" />
                View on GitHub
              </Button>
            </div>

            {/* Tech Stack Badges */}
            <div className="flex flex-wrap justify-center gap-3 pt-8">
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">React</span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">TypeScript</span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">Express</span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">Tailwind CSS</span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">JSON Storage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Everything You Need to Start</h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Pre-configured with modern tooling and best practices for rapid development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FolderTree className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Monorepo Structure</h3>
                <p className="text-muted-foreground">
                  Organized with apps/ and packages/ directories for scalable team development and code sharing.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold">Built-in Authentication</h3>
                <p className="text-muted-foreground">
                  Complete auth flow with login, signup, and protected routes using secure session management.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Palette className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Dark/Light Theme</h3>
                <p className="text-muted-foreground">
                  Smooth theme switching with proper contrast ratios and accessibility considerations.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">JSON File Storage</h3>
                <p className="text-muted-foreground">
                  No database required - user data stored in structured JSON files for rapid prototyping.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold">Responsive Design</h3>
                <p className="text-muted-foreground">
                  Mobile-first approach with Tailwind CSS for consistent UI across all devices.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">TypeScript Ready</h3>
                <p className="text-muted-foreground">
                  Full TypeScript configuration across frontend and backend with strict type safety.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Architecture Section */}
      <div id="architecture" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Project Structure</h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Clean, scalable architecture designed for team collaboration
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary" />
                    Monorepo Structure
                  </h3>
                  <div className="space-y-3 text-sm font-mono">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">devnest/</span>
                    </div>
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-primary" />
                        <span>apps/</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-secondary" />
                          <span>web/ <span className="text-muted-foreground">(React frontend)</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-accent" />
                          <span>api/ <span className="text-muted-foreground">(Express backend)</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <span>packages/</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-secondary" />
                          <span>user-profile/</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Component className="w-4 h-4 text-accent" />
                          <span>shared-components/</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        <span>data/ <span className="text-muted-foreground">(JSON storage)</span></span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2 text-primary">Frontend</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• React 18 + TypeScript</li>
                      <li>• Tailwind CSS</li>
                      <li>• Lucide Icons</li>
                      <li>• Responsive Design</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2 text-secondary">Backend</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Express + TypeScript</li>
                      <li>• JSON File Storage</li>
                      <li>• Session Management</li>
                      <li>• API Routes</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Start</h3>
                <div className="space-y-3">
                  <div className="bg-muted rounded-md p-3 font-mono text-sm">
                    <div className="text-muted-foreground mb-2"># Clone and install</div>
                    <div>git clone devnest-template</div>
                    <div>cd devnest && npm install</div>
                  </div>
                  <div className="bg-muted rounded-md p-3 font-mono text-sm">
                    <div className="text-muted-foreground mb-2"># Start development servers</div>
                    <div>npm run dev</div>
                  </div>
                  <div className="bg-muted rounded-md p-3 font-mono text-sm">
                    <div className="text-muted-foreground mb-2"># Build for production</div>
                    <div>npm run build</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Code className="w-6 h-6 text-primary" />
              <span className="font-semibold">DevNest</span>
              <span className="text-muted-foreground">- Full-Stack Monorepo Template</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <BookOpen className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
