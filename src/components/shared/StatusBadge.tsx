import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  label: string
  colorClass: string
  className?: string
}

export function StatusBadge({ label, colorClass, className }: StatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn('text-white', colorClass, className)}>
      {label}
    </Badge>
  )
}
