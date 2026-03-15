import React from "react"
import { Link, useLocation } from "wouter"
import { 
  LayoutDashboard, 
  FilePlus2, 
  ArrowRightLeft, 
  Settings, 
  ShieldCheck,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "New Claim", href: "/claims/new", icon: FilePlus2 },
  { name: "Portal Demo", href: "/portal-demo", icon: ArrowRightLeft },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen w-full bg-background/50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:static lg:flex lg:translate-x-0 shadow-2xl lg:shadow-none border-r border-sidebar-border",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 shrink-0 items-center gap-3 px-6 border-b border-sidebar-border/50">
          <Link
            href="/"
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="bg-primary/20 p-2 rounded-xl">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <span className="font-display text-xl font-bold tracking-wide">ClaimTrace</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto lg:hidden text-sidebar-foreground/50 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6">
          <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-4 px-2">Menu</div>
          {navigation.map((item) => {
            const isActive = location === item.href || (location.startsWith("/claims") && item.href === "/dashboard" && location !== "/claims/new")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors duration-200",
                    isActive ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                  )}
                />
                {item.name}
                {isActive && (
                  <div className="ml-auto w-1.5 h-5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-6 border-t border-sidebar-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary border border-primary/30">
              JS
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Judge System</span>
              <span className="text-xs text-sidebar-foreground/50">Enterprise Tier</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-4 border-b border-border/40 glass px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden -ml-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex flex-1 items-center justify-between">
            <div className="font-medium text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
                Nova Lite Active
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50/30">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
