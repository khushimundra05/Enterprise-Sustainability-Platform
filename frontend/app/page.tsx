"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  ArrowRight,
  Leaf,
  BarChart3,
  Zap,
  Users,
  Shield,
  TrendingUp,
  Target,
  Workflow,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Wind,
  Droplet,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 dark:from-background dark:via-background dark:to-primary/5">
      {/* Navigation */}
      <header className="border-b bg-background/80 dark:bg-background/80 backdrop-blur-md sticky top-0 z-50 shadow-sm transition-smooth">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-md hover:shadow-lg transition-smooth">
              <Leaf className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SustainHub
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Enter Platform <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32 text-center">
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 animate-fade-in">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-semibold">
            Enterprise Sustainability Platform
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-foreground animate-slide-in-up text-balance">
          Transform Your{" "}
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Sustainability Strategy
          </span>
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-slide-in-up leading-relaxed">
          AI-powered platform for enterprises to track emissions, manage energy, water, and waste, while meeting compliance requirements and achieving measurable sustainability impact.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-in-up">
          <Link href="/login">
            <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl">
              Get Started <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>

          <Button size="lg" variant="outline" className="shadow-md hover:shadow-lg">
            View Demo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-w-2xl mx-auto animate-slide-in-up">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-1">40%</div>
            <div className="text-xs text-muted-foreground">Avg Emissions Reduction</div>
          </div>
          <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/10">
            <div className="text-2xl md:text-3xl font-bold text-secondary mb-1">500+</div>
            <div className="text-xs text-muted-foreground">Enterprise Customers</div>
          </div>
          <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
            <div className="text-2xl md:text-3xl font-bold text-accent mb-1">99.9%</div>
            <div className="text-xs text-muted-foreground">Uptime SLA</div>
          </div>
          <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
            <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">10</div>
            <div className="text-xs text-muted-foreground">Core Modules</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16 animate-slide-in-up">
          <Badge variant="secondary" className="mb-4">10 Core Modules</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Comprehensive ESG Management
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need for enterprise sustainability, from data collection to insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              icon: BarChart3,
              title: "Dashboard",
              desc: "Real-time sustainability overview",
              color: "text-primary",
            },
            {
              icon: Wind,
              title: "Carbon Tracking",
              desc: "Monitor emissions by source",
              color: "text-primary",
            },
            {
              icon: Zap,
              title: "Energy Mgmt",
              desc: "Track and optimize usage",
              color: "text-secondary",
            },
            {
              icon: Droplet,
              title: "Water Tracking",
              desc: "Monitor consumption",
              color: "text-secondary",
            },
            {
              icon: AlertCircle,
              title: "Waste Mgmt",
              desc: "Manage waste streams",
              color: "text-accent",
            },
            {
              icon: Workflow,
              title: "Supply Chain",
              desc: "Supplier sustainability",
              color: "text-primary",
            },
            {
              icon: Shield,
              title: "Compliance",
              desc: "Regulatory requirements",
              color: "text-accent",
            },
            {
              icon: Target,
              title: "Goals & Targets",
              desc: "Set and track goals",
              color: "text-secondary",
            },
            {
              icon: Users,
              title: "Team Collab",
              desc: "Cross-team coordination",
              color: "text-primary",
            },
            {
              icon: BarChart3,
              title: "Reports",
              desc: "AI-powered analytics",
              color: "text-secondary",
            },
          ].map((feature, idx) => {
            const Icon = feature.icon;

            return (
              <Card key={idx} className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors ${feature.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center text-foreground animate-slide-in-up">
          Why Choose SustainHub
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="space-y-8 animate-slide-in-up">
            {[
              {
                title: "AI-Powered Insights",
                desc: "OpenAI integration for intelligent recommendations and anomaly detection",
                icon: Sparkles,
              },
              {
                title: "Real-Time Tracking",
                desc: "Monitor sustainability metrics across all facilities in real-time",
                icon: TrendingUp,
              },
              {
                title: "Compliance Ready",
                desc: "Built for ISO 14001, CDP, CSRD and other major frameworks",
                icon: CheckCircle2,
              },
              {
                title: "Cloud Native",
                desc: "Deployed on AWS with DynamoDB for scalability and reliability",
                icon: Shield,
              },
            ].map((benefit, idx) => {
              const BenefitIcon = benefit.icon;
              return (
                <div key={idx} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <BenefitIcon className="text-primary h-6 w-6" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="lg:col-span-1 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg animate-slide-in-up">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">
                Measurable Impact
              </CardTitle>
              <CardDescription>
                Real results from enterprises using SustainHub
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">40-50% Emissions Reduction</div>
                    <div className="text-sm text-muted-foreground">Average first-year impact</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">25% Energy Cost Savings</div>
                    <div className="text-sm text-muted-foreground">Through optimization insights</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">100% Regulatory Compliance</div>
                    <div className="text-sm text-muted-foreground">All major frameworks supported</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">80% Faster Reporting</div>
                    <div className="text-sm text-muted-foreground">Automated ESG reports</div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground pt-4 border-t border-border">
                Join 500+ leading enterprises already transforming their sustainability strategy with SustainHub.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 shadow-xl animate-slide-in-up">
          <CardHeader className="pb-6">
            <CardTitle className="text-4xl md:text-5xl">
              Ready to Lead in Sustainability?
            </CardTitle>
            <CardDescription className="text-lg mt-4">
              Start tracking your organization&apos;s environmental impact today with
              SustainHub&apos;s comprehensive platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl">
                  Launch Platform <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="shadow-md hover:shadow-lg">
                Schedule Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  <Leaf className="h-5 w-5" />
                </div>
                <span className="font-bold text-foreground">SustainHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enterprise sustainability management made simple.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Reports</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 SustainHub. Building a sustainable future, one enterprise at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
