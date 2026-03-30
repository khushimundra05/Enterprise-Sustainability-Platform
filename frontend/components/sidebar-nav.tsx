'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Leaf,
  Zap,
  Droplet,
  Trash2,
  Users,
  FileText,
  Target,
  TrendingUp,
  Award,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export function SidebarNav() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)

  const modules = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      href: '/dashboard',
    },
    {
      id: 'carbon',
      label: 'Carbon Emissions',
      icon: Leaf,
      href: '/carbon',
    },
    {
      id: 'energy',
      label: 'Energy Management',
      icon: Zap,
      href: '/energy',
    },
    {
      id: 'water',
      label: 'Water Tracking',
      icon: Droplet,
      href: '/water',
    },
    {
      id: 'waste',
      label: 'Waste Management',
      icon: Trash2,
      href: '/waste',
    },
    {
      id: 'supply-chain',
      label: 'Supply Chain',
      icon: TrendingUp,
      href: '/supply-chain',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Award,
      href: '/compliance',
    },
    {
      id: 'goals',
      label: 'Goals & Targets',
      icon: Target,
      href: '/goals',
    },
    {
      id: 'team',
      label: 'Team Collaboration',
      icon: Users,
      href: '/team',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      href: '/reports',
    },
  ]

  return (
    <aside
      className={cn(
        'border-r border-border bg-sidebar dark:bg-sidebar transition-all duration-300 flex flex-col h-screen',
        expanded ? 'w-64' : 'w-20',
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {expanded && <span className="text-xs font-bold text-sidebar-foreground/60 uppercase tracking-wider">MODULES</span>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(!expanded)}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {modules.map((module) => {
          const Icon = module.icon
          const isActive = pathname === module.href

          return (
            <Link key={module.id} href={module.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {expanded && <span className="text-sm font-medium">{module.label}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent">
              {expanded && <span className="text-xs font-bold text-sidebar-foreground/60 uppercase tracking-wider">SETTINGS</span>}
            </Button>
          </CollapsibleTrigger>
          {expanded && (
            <CollapsibleContent className="mt-2 space-y-1">
              <Link href="/settings/organization">
                <Button variant="ghost" className="w-full justify-start text-xs text-sidebar-foreground hover:bg-sidebar-accent">
                  Organization
                </Button>
              </Link>
              <Link href="/settings/integrations">
                <Button variant="ghost" className="w-full justify-start text-xs text-sidebar-foreground hover:bg-sidebar-accent">
                  Integrations
                </Button>
              </Link>
              <Link href="/settings/team">
                <Button variant="ghost" className="w-full justify-start text-xs text-sidebar-foreground hover:bg-sidebar-accent">
                  Team Access
                </Button>
              </Link>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    </aside>
  )
}
