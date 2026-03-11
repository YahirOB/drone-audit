import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ClipboardList, FileSearch, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { getTasks } from '@/services/taskService'
import { getAuditResults } from '@/services/auditService'
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, AUDIT_STATUS_LABELS, AUDIT_STATUS_COLORS } from '@/lib/constants'
import type { AuditTask } from '@/types/task'
import type { AuditResult } from '@/types/audit'

export function DashboardPage() {
  const [tasks, setTasks] = useState<AuditTask[]>([])
  const [audits, setAudits] = useState<AuditResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [t, a] = await Promise.all([getTasks(), getAuditResults()])
        setTasks(t)
        setAudits(a)
      } catch {
        // Firebase not configured yet - show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner />

  const activeTasks = tasks.filter((t) => t.status !== 'validated')
  const pendingReviews = audits.filter((a) => a.status === 'pending_review')
  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const validatedTasks = tasks.filter((t) => t.status === 'validated')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link to="/tasks/new">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tareas Activas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes de Revision</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingReviews.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completedTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Validadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{validatedTasks.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tareas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Sin tareas"
                description="Crea tu primera tarea de auditoria"
                action={
                  <Button asChild size="sm">
                    <Link to="/tasks/new">Crear Tarea</Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.warehouseLocation} - Pasillo {task.aisle}
                      </p>
                    </div>
                    <StatusBadge
                      label={TASK_STATUS_LABELS[task.status]}
                      colorClass={TASK_STATUS_COLORS[task.status]}
                    />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Auditorias Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {audits.length === 0 ? (
              <EmptyState
                icon={FileSearch}
                title="Sin auditorias"
                description="Las auditorias apareceran cuando los operadores suban sus resultados"
              />
            ) : (
              <div className="space-y-3">
                {audits.slice(0, 5).map((audit) => (
                  <Link
                    key={audit.id}
                    to={`/audits/${audit.id}/review`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{audit.metadata.operatorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {audit.metadata.warehouseLocation} - {audit.summary.totalItemsDetected} items
                      </p>
                    </div>
                    <StatusBadge
                      label={AUDIT_STATUS_LABELS[audit.status]}
                      colorClass={AUDIT_STATUS_COLORS[audit.status]}
                    />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
