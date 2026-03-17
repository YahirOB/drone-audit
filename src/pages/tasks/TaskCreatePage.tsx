import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTask } from '@/services/taskService'
import { useAuthStore } from '@/stores/authStore'
import { STORAGE_TYPE_LABELS } from '@/lib/constants'
import type { StorageType } from '@/types/task'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function TaskCreatePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [warehouseLocation, setWarehouseLocation] = useState('')
  const [aisle, setAisle] = useState('')
  const [posFrom, setPosFrom] = useState('')
  const [posTo, setPosTo] = useState('')
  const [storageType, setStorageType] = useState<StorageType>('racks')
  const [rowSize, setRowSize] = useState(6)
  const [columnSize, setColumnSize] = useState(12)
  const [idLength, setIdLength] = useState(10)
  const [locationName, setLocationName] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const taskId = await createTask({
        title,
        warehouseLocation,
        aisle,
        positionRange: { from: posFrom, to: posTo },
        config: {
          storageType,
          rowSize,
          columnSize,
          idLength,
          locationName,
        },
        status: 'created',
        createdBy: user.uid,
        notes,
      })
      toast.success('Tarea creada exitosamente')
      navigate(`/tasks/${taskId}`)
    } catch {
      toast.error('Error al crear la tarea')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" render={<Link to="/tasks" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Nueva Tarea de Auditoria</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informacion General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo de la tarea</Label>
              <Input
                id="title"
                placeholder="Ej: Auditoria Pasillo A - Zona Norte"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse">Ubicacion del Almacen</Label>
                <Input
                  id="warehouse"
                  placeholder="Ej: Almacen Central CDMX"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aisle">Pasillo</Label>
                <Input
                  id="aisle"
                  placeholder="Ej: A1"
                  value={aisle}
                  onChange={(e) => setAisle(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="posFrom">Posicion Desde</Label>
                <Input
                  id="posFrom"
                  placeholder="Ej: A01"
                  value={posFrom}
                  onChange={(e) => setPosFrom(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="posTo">Posicion Hasta</Label>
                <Input
                  id="posTo"
                  placeholder="Ej: A15"
                  value={posTo}
                  onChange={(e) => setPosTo(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Instrucciones adicionales para el operador..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuracion del Almacen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Almacen</Label>
                <Select value={storageType} onValueChange={(v) => v && setStorageType(v as StorageType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STORAGE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationName">Nombre de Ubicacion</Label>
                <Input
                  id="locationName"
                  placeholder="Ej: Zona Norte"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rowSize">Tamano de Filas</Label>
                <Input
                  id="rowSize"
                  type="number"
                  min={1}
                  max={999}
                  value={rowSize}
                  onChange={(e) => setRowSize(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="columnSize">Tamano de Columnas</Label>
                <Input
                  id="columnSize"
                  type="number"
                  min={1}
                  max={999}
                  value={columnSize}
                  onChange={(e) => setColumnSize(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idLength">Longitud del ID</Label>
                <Input
                  id="idLength"
                  type="number"
                  min={1}
                  max={50}
                  value={idLength}
                  onChange={(e) => setIdLength(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/tasks')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Tarea'}
          </Button>
        </div>
      </form>
    </div>
  )
}
