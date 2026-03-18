import { LogOut, Menu } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { useAuthStore } from '@/stores/authStore'
import { logout } from '@/services/authService'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { MobileSidebar } from './MobileSidebar'

export function Header() {
  const user = useAuthStore((s) => s.user)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'md:hidden' })}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
            <MobileSidebar />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-medium md:hidden">Drone Audit</span>
      </div>
      <div className="flex items-center gap-2">
        {user && (
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user.displayName}
          </span>
        )}
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Cerrar sesion">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
