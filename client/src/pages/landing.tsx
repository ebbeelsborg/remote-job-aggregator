import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe, Search, BarChart3, Briefcase, ArrowRight } from "lucide-react";
import heroBg from "../assets/images/hero-bg.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="font-serif text-lg font-semibold" data-testid="text-logo">Anywhere Jobs</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/login" data-testid="link-login-nav">
              <Button variant="outline">Log in</Button>
            </a>
            <a href="/api/login" data-testid="link-signup-nav">
              <Button>Get Started</Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="relative pt-14 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-blue-300 mb-4 tracking-wide uppercase" data-testid="text-hero-tag">
              Software Engineering Jobs
            </p>
            <h1
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              data-testid="text-hero-title"
            >
              Find your next remote role, anywhere in the world
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-lg" data-testid="text-hero-subtitle">
              We aggregate software engineering opportunities from 8+ job boards so you can focus on what matters — finding the right fit.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a href="/api/login" data-testid="link-get-started-hero">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-400">
              <span>Free to use</span>
              <span className="hidden sm:inline">|</span>
              <span>No credit card required</span>
              <span className="hidden sm:inline">|</span>
              <span>Updated daily</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold mb-3" data-testid="text-features-title">
            Everything you need for your job search
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Powerful tools to help you discover, track, and land your next remote position.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6" data-testid="card-feature-aggregate">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">8+ Job Sources</h3>
            <p className="text-sm text-muted-foreground">
              We pull from Remotive, Himalayas, WeWorkRemotely, TheMuse, and more — all in one place.
            </p>
          </Card>

          <Card className="p-6" data-testid="card-feature-filter">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Smart Filtering</h3>
            <p className="text-sm text-muted-foreground">
              Filter by experience level, company, and search keywords to find exactly what you're looking for.
            </p>
          </Card>

          <Card className="p-6" data-testid="card-feature-dashboard">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              See trends across sources, levels, and companies at a glance to guide your search strategy.
            </p>
          </Card>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span data-testid="text-footer-copyright">Anywhere Jobs {new Date().getFullYear()}</span>
          <div className="flex items-center gap-4">
            <span>Built with Replit</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
