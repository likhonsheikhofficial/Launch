'use client'

import React from 'react'
import { LogoCloud } from '@/components/ui/logo-cloud'
import { SkewedScroll } from '@/components/ui/skewed-scroll'
import { ShortcutModal } from '@/components/ui/shortcut-modal'
import { useShortcuts } from '@/hooks/use-shortcuts'
import { Button } from '@/components/ui/button'
import { 
  RocketIcon, 
  KeyboardIcon, 
  CodeIcon, 
  BrainCircuitIcon,
  SparklesIcon, 
  LayersIcon,
  BrainIcon,
  CpuIcon 
} from 'lucide-react'

export default function DemoPage() {
  // Tech stack logos
  const techLogos = [
    {
      src: '/next.svg',
      alt: 'Next.js',
      width: 128,
      height: 80,
    },
    {
      src: '/react.svg',
      alt: 'React',
      width: 128,
      height: 80,
    },
    {
      src: '/typescript.svg',
      alt: 'TypeScript',
      width: 128,
      height: 80,
    },
    {
      src: '/tailwind.svg',
      alt: 'Tailwind CSS',
      width: 128,
      height: 80,
    },
    {
      src: '/python.svg',
      alt: 'Python',
      width: 128,
      height: 80,
    }
  ]

  // Feature items for skewed scroll
  const featureItems = [
    {
      title: 'AI-Powered Development',
      description: 'Leverage machine learning to accelerate your development workflow',
      icon: <BrainCircuitIcon className="w-6 h-6" />,
    },
    {
      title: 'Real-time Collaboration',
      description: 'Work together seamlessly with built-in version control and live updates',
      icon: <SparklesIcon className="w-6 h-6" />,
    },
    {
      title: 'Component Library',
      description: 'Extensive collection of pre-built, customizable UI components',
      icon: <LayersIcon className="w-6 h-6" />,
    },
    {
      title: 'Smart Suggestions',
      description: 'Context-aware code suggestions and automated refactoring',
      icon: <BrainIcon className="w-6 h-6" />,
    },
    {
      title: 'Performance Optimization',
      description: 'Automatic performance monitoring and optimization suggestions',
      icon: <CpuIcon className="w-6 h-6" />,
    }
  ]

  // Keyboard shortcuts configuration
  const shortcuts = [
    {
      key: 'k',
      ctrlKey: true,
      category: 'General',
      description: 'Command palette',
      action: () => console.log('Opening command palette'),
    },
    {
      key: '/',
      ctrlKey: true,
      category: 'Editor',
      description: 'Search in file',
      action: () => console.log('Search initiated'),
    },
    {
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      category: 'Navigation',
      description: 'Quick preview',
      action: () => console.log('Preview activated'),
    },
    {
      key: 's',
      ctrlKey: true,
      category: 'Editor',
      description: 'Save changes',
      action: () => console.log('Saving changes'),
    },
  ]

  const { modalOpen, setModalOpen, shortcuts: formattedShortcuts } = useShortcuts(shortcuts)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Hero Section */}
      <section className="px-4 pt-20 pb-16 mx-auto max-w-7xl">
        <div className="text-center space-y-8 mb-16">
          <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
            Launch AI Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build powerful applications with AI-driven development, real-time collaboration, 
            and an extensive component library.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="gap-2">
              <RocketIcon className="w-4 h-4" />
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => setModalOpen(true)}>
              <KeyboardIcon className="w-4 h-4" />
              View Shortcuts
            </Button>
          </div>
        </div>

        {/* Technology Showcase */}
        <LogoCloud 
          logos={techLogos} 
          speed="normal" 
          className="mt-20"
        />
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            Powerful Features
          </h2>
          <SkewedScroll 
            items={featureItems} 
            className="max-w-2xl mx-auto"
            duration={25000}
          />
        </div>
      </section>

      {/* Development Tools Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">
            Built for Modern Development
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            Experience a new way of building applications with our AI-powered 
            development tools and real-time collaboration features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {featureItems.slice(0, 3).map((item, index) => (
              <div 
                key={index}
                className="p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-primary/10 hover:border-primary/20 transition-all"
              >
                <div className="rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shortcuts Modal */}
      <ShortcutModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        shortcuts={formattedShortcuts}
      />
    </div>
  )
}
