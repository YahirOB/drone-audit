import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, MapPin, Grid3x3, Hash } from 'lucide-react'
import { getTask, updateTaskStatus } from '@/services/taskService'
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, STORAGE_TYPE_LABELS } from '@/lib/constants'
import type { AuditTask, TaskStatus } from '@/types/task'
import { toast } from 'sonner'

const STATUS_FLOW: TaskStatus[] = ['created', 'assigned', 'in_progress', 'completed', 'validated']

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const [task, setTask] = useState<AuditTask | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!taskId) return
    async function load() {
      try {
        const data = await getTask(taskId!)
        setTask(data)
      } catch {
        // Firebase not configured
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [taskId])

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return
    setUpdating(true)
    try {
      await updateTaskStatus(task.id, newStatus)
      setTask({ ...task, status: newStatus })
      toast.success(`Estado actualizado a ${TASK_STATUS_LABELS[newStatus]}`)
    } catch {
      toast.error('Error al actualizar el estado')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tarea no encontrada</p>
        <Button asChild className="mt-4">
          <Link to="/tasks">Volver a tareas</Link>
        </Button>
      </div>
    )
  }

  const currentIdx = STATUS_FLOW.indexOf(task.status)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/tasks">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <p className="text-sm text-muted-foreground">
            {task.warehouseLocation} - Pasillo {task.aisle}
          </p>
        </div>
        <StatusBadge
          label={TASK_STATUS_LABELS[task.status]}
          colorClass={TASK_STATUS_COLORS[task.status]}
        />
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progreso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {STATUS_FLOW.map((status, idx) => {
              const isActive = idx <= currentIdx
              return (
                <div key={status} className="flex items-center gap-2 flex-1">
                  <div
                    className={`h-8 flex-1 rounded text-xs font-medium flex items-center justify-center transition-colors ${
                      isActive ? TASK_STATUS_COLORS[status] + ' text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {TASK_STATUS_LABELS[status]}
                  </div>
                </div>
              )
            })}
          </div>
          {currentIdx < STATUS_FLOW.length - 1 && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => handleStatusChange(STATUS_FLOW[currentIdx + 1])}
                disabled={updating}
              >
                {updating ? 'Actualizando...' : `Avanzar a ${TASK_STATUS_LABELS[STATUS_FLOW[currentIdx + 1]]}`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Ubicacion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Almacen</span>
              <span className="text-sm font-medium">{task.warehouseLocation}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pasillo</span>
              <span className="text-sm font-medium">{task.aisle}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Rango</span>
              <span className="text-sm font-medium">{task.positionRange.from} - {task.positionRange.to}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" /> Configuracion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tipo</span>
              <span className="text-sm font-medium">{STORAGE_TYPE_LABELS[task.config.storageType]}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Filas x Columnas</span>
              <span className="text-sm font-medium">{task.config.rowSize} x {task.config.columnSize}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" /> Longitud ID
              </span>
              <span className="text-sm font-medium">{task.config.idLength}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {task.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
