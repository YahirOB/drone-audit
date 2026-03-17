import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  FileSearch,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SheetClose } from '@/components/ui/sheet'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tareas', icon: ClipboardList },
  { to: '/tasks/new', label: 'Nueva Tarea', icon: Plus },
  { to: '/audits', label: 'Auditorias', icon: FileSearch },
]

export function MobileSidebar() {
  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold tracking-tight">Drone Audit</h1>
        <p className="text-xs text-muted-foreground mt-1">Sistema de Gestion</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <SheetClose
            key={item.to}
            render={
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )
                }
              />
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </SheetClose>
        ))}
      </nav>
    </div>
  )
}
