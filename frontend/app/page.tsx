import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, CheckCircle, Layout, FolderKanban, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">TaskSphere</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium transition-colors hover:text-primary">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium transition-colors hover:text-primary">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-sm font-medium transition-colors hover:text-primary">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" passHref>
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/dashboard" passHref>
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="py-20 md:py-28">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-4 md:gap-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                <span>Powered by AI</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Task Management,{" "}
                <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                  Reimagined
                </span>
              </h1>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                TaskSphere combines intuitive design with AI assistance to help you organize tasks,
                boost productivity, and achieve your goals effortlessly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard" passHref>
                  <Button size="lg" className="gap-1">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features" passHref>
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        <section className="bg-muted/50 py-16 md:py-20" id="features">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-4 mb-10 md:mb-16">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Key Features
              </h2>
              <p className="max-w-[700px] text-muted-foreground">
                Discover what makes TaskSphere the ideal solution for staying organized and productive.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex flex-col items-start gap-2 bg-background p-6 rounded-lg shadow-sm border">
                <div className="p-2 rounded-full bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Smart Task Management</h3>
                <p className="text-muted-foreground">
                  Create, organize, and prioritize tasks with intuitive controls and flexible views.
                </p>
              </div>
              
              <div className="flex flex-col items-start gap-2 bg-background p-6 rounded-lg shadow-sm border">
                <div className="p-2 rounded-full bg-primary/10">
                  <Layout className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Project Organization</h3>
                <p className="text-muted-foreground">
                  Group related tasks into projects with custom colors and visual organization.
                </p>
              </div>
              
              <div className="flex flex-col items-start gap-2 bg-background p-6 rounded-lg shadow-sm border">
                <div className="p-2 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">AI Assistant</h3>
                <p className="text-muted-foreground">
                  Get personalized suggestions and help organizing your tasks from our AI assistant.
                </p>
              </div>
              
              <div className="flex flex-col items-start gap-2 bg-background p-6 rounded-lg shadow-sm border">
                <div className="p-2 rounded-full bg-primary/10">
                  <FolderKanban className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Customizable Workflows</h3>
                <p className="text-muted-foreground">
                  Adapt TaskSphere to your personal workflow with flexible status options and filters.
                </p>
              </div>
              
              <div className="flex flex-col items-start gap-2 bg-background p-6 rounded-lg shadow-sm border">
                <div className="p-2 rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Due Dates & Reminders</h3>
                <p className="text-muted-foreground">
                  Never miss a deadline with built-in due dates and smart reminders for important tasks.
                </p>
              </div>
              
              <div className="flex flex-col items-start gap-2 bg-background p-6 rounded-lg shadow-sm border">
                <div className="p-2 rounded-full bg-primary/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Progress Tracking</h3>
                <p className="text-muted-foreground">
                  Monitor your productivity with visual progress indicators and completion statistics.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 md:py-20" id="how-it-works">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-4 mb-10 md:mb-16">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                How It Works
              </h2>
              <p className="max-w-[700px] text-muted-foreground">
                Get started with TaskSphere in just a few simple steps.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold">Create an Account</h3>
                <p className="text-muted-foreground">
                  Sign up for a free account to get started with TaskSphere.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold">Add Your Tasks</h3>
                <p className="text-muted-foreground">
                  Create tasks, set priorities, and organize them into projects.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold">Boost Your Productivity</h3>
                <p className="text-muted-foreground">
                  Use AI suggestions and smart organization to accomplish more.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center mt-12">
              <Link href="/dashboard" passHref>
                <Button size="lg" className="gap-1">
                  Try TaskSphere Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        <section className="bg-muted/50 py-16 md:py-20" id="testimonials">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-4 mb-10 md:mb-16">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                What Users Say
              </h2>
              <p className="max-w-[700px] text-muted-foreground">
                Discover how TaskSphere has helped people stay organized and boost productivity.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-sm border">
                <div className="flex flex-col gap-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="#6C63FF"
                        className="h-5 w-5"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    "TaskSphere has completely transformed how I organize my work. The AI suggestions are spot on and have helped me prioritize effectively."
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div>
                      <p className="font-medium">Sarah Johnson</p>
                      <p className="text-sm text-muted-foreground">Product Manager</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-background p-6 rounded-lg shadow-sm border">
                <div className="flex flex-col gap-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="#6C63FF"
                        className="h-5 w-5"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    "The project organization in TaskSphere is intuitive and flexible. It adapts perfectly to my workflow and helps me stay on track."
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div>
                      <p className="font-medium">Michael Rodriguez</p>
                      <p className="text-sm text-muted-foreground">Software Developer</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-background p-6 rounded-lg shadow-sm border">
                <div className="flex flex-col gap-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="#6C63FF"
                        className="h-5 w-5"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    "I've tried many task management apps, but TaskSphere is by far the best. The clean UI and smart features make staying organized effortless."
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div>
                      <p className="font-medium">Emily Chen</p>
                      <p className="text-sm text-muted-foreground">Marketing Director</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 md:py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-6 md:gap-8">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl max-w-[800px]">
                Ready to transform your productivity with TaskSphere?
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Join thousands of users who've already streamlined their task management.
              </p>
              <Link href="/dashboard" passHref>
                <Button size="lg" className="gap-1">
                  Get Started for Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                No credit card required. Free forever plan available.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-6 md:py-10">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold">TaskSphere</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Reimagining task management with AI assistance and intuitive design.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#blog" className="text-muted-foreground hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#careers" className="text-muted-foreground hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#terms" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#cookies" className="text-muted-foreground hover:text-foreground transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center mt-10 border-t pt-6">
            <p className="text-xs text-muted-foreground">
              © 2025 TaskSphere, Inc. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="#twitter" className="text-muted-foreground hover:text-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </Link>
              <Link href="#instagram" className="text-muted-foreground hover:text-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
              <Link href="#github" className="text-muted-foreground hover:text-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}