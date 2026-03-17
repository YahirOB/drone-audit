import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, ClipboardList } from 'lucide-react'
import { getTasks } from '@/services/taskService'
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@/lib/constants'
import type { AuditTask, TaskStatus } from '@/types/task'

export function TaskListPage() {
  const [tasks, setTasks] = useState<AuditTask[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function load() {
      try {
        const data = await getTasks()
        setTasks(data)
      } catch {
        // Firebase not configured
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = statusFilter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === statusFilter)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tareas de Auditoria</h1>
        <Button render={<Link to="/tasks/new" />}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {(Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} tareas</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin tareas"
          description={statusFilter === 'all' ? 'Crea tu primera tarea de auditoria' : 'No hay tareas con este estado'}
          action={
            <Button size="sm" render={<Link to="/tasks/new" />}>
              Crear Tarea
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((task) => (
            <Link key={task.id} to={`/tasks/${task.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.warehouseLocation} - Pasillo {task.aisle} ({task.positionRange.from} a {task.positionRange.to})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.config.storageType} | {task.config.rowSize} filas x {task.config.columnSize} columnas
                    </p>
                  </div>
                  <StatusBadge
                    label={TASK_STATUS_LABELS[task.status]}
                    colorClass={TASK_STATUS_COLORS[task.status]}
                  />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
