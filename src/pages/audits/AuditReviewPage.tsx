import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ArrowLeft, Download, Eye, Share2, CheckCircle, BarChart3, Package, AlertTriangle } from 'lucide-react'
import { getAuditResult, fetchFullAuditData, updateAuditStatus } from '@/services/auditService'
import { updateTaskStatus } from '@/services/taskService'
import { exportAuditToExcel } from '@/features/audits/utils/excelExport'
import { useAuthStore } from '@/stores/authStore'
import {
  AUDIT_STATUS_LABELS,
  AUDIT_STATUS_COLORS,
  ITEM_STATUS_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
} from '@/lib/constants'
import type { AuditResult, AuditExportData, ItemStatus } from '@/types/audit'
import { toast } from 'sonner'

export function AuditReviewPage() {
  const { auditId } = useParams<{ auditId: string }>()
  const user = useAuthStore((s) => s.user)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [fullData, setFullData] = useState<AuditExportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [validateOpen, setValidateOpen] = useState(false)
  const [validating, setValidating] = useState(false)
  const [itemFilter, setItemFilter] = useState<ItemStatus | 'all'>('all')

  useEffect(() => {
    if (!auditId) return
    async function load() {
      try {
        const r = await getAuditResult(auditId!)
        setResult(r)
        if (r?.exportDataPath) {
          const data = await fetchFullAuditData(r.exportDataPath)
          setFullData(data)
        }
      } catch {
        // Firebase not configured
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [auditId])

  const handleDownload = () => {
    if (!fullData) return
    exportAuditToExcel(fullData)
    toast.success('Archivo Excel descargado')
  }

  const handleValidate = async () => {
    if (!result || !user) return
    setValidating(true)
    try {
      await updateAuditStatus(result.id, 'validated', user.uid)
      if (result.taskId) {
        await updateTaskStatus(result.taskId, 'validated')
      }
      setResult({ ...result, status: 'validated' })
      setValidateOpen(false)
      toast.success('Auditoria validada exitosamente')
    } catch {
      toast.error('Error al validar')
    } finally {
      setValidating(false)
    }
  }

  const handleShare = () => {
    if (!fullData) return
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria-${fullData.metadata.auditId}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('JSON descargado')
  }

  if (loading) return <LoadingSpinner />
  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Auditoria no encontrada</p>
        <Link to="/audits" className={buttonVariants({ className: 'mt-4' })}>
          Volver a auditorias
        </Link>
      </div>
    )
  }

  const filteredItems = fullData
    ? itemFilter === 'all'
      ? fullData.items
      : fullData.items.filter((i) => i.status === itemFilter)
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/audits" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Revision de Auditoria</h1>
          <p className="text-sm text-muted-foreground">
            {result.metadata.warehouseLocation} - Pasillo {result.metadata.aisle}
          </p>
        </div>
        <StatusBadge
          label={AUDIT_STATUS_LABELS[result.status]}
          colorClass={AUDIT_STATUS_COLORS[result.status]}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleDownload} disabled={!fullData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Descargar Excel
        </Button>
        <Link to={`/audits/${auditId}/review`} className={buttonVariants({ variant: 'outline' })}>
          <Eye className="h-4 w-4 mr-2" />
          Revisar
        </Link>
        <Button onClick={handleShare} disabled={!fullData} variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Compartir JSON
        </Button>
        <Button
          onClick={() => setValidateOpen(true)}
          disabled={result.status === 'validated'}
          variant={result.status === 'validated' ? 'outline' : 'default'}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {result.status === 'validated' ? 'Validada' : 'Validar'}
        </Button>
        <Link to={`/audits/${auditId}/compulsa`} className={buttonVariants({ variant: 'outline' })}>
          Compulsa
        </Link>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary" className="gap-1">
            <BarChart3 className="h-3.5 w-3.5" /> Resumen
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-1">
            <Package className="h-3.5 w-3.5" /> Inventario
          </TabsTrigger>
          <TabsTrigger value="discrepancies" className="gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Discrepancias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{result.summary.totalItemsDetected}</p>
                <p className="text-xs text-muted-foreground">Items Detectados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{result.summary.totalDiscrepancies}</p>
                <p className="text-xs text-muted-foreground">Discrepancias</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{result.summary.coveragePercent}%</p>
                <p className="text-xs text-muted-foreground">Cobertura</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{result.summary.scanDurationMinutes}m</p>
                <p className="text-xs text-muted-foreground">Duracion</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informacion de la Auditoria</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Operador:</span> {result.metadata.operatorName}</div>
              <div><span className="text-muted-foreground">Drone:</span> {result.metadata.droneModel}</div>
              <div><span className="text-muted-foreground">Inicio:</span> {result.metadata.startedAt}</div>
              <div><span className="text-muted-foreground">Fin:</span> {result.metadata.completedAt}</div>
              <div><span className="text-muted-foreground">Rango:</span> {result.metadata.positionRange.from} - {result.metadata.positionRange.to}</div>
              <div><span className="text-muted-foreground">Version:</span> {result.metadata.softwareVersion}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex items-center gap-2">
            <select
              className="text-sm border rounded px-2 py-1 bg-background"
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value as ItemStatus | 'all')}
            >
              <option value="all">Todos ({fullData?.items.length ?? 0})</option>
              {(['found', 'missing', 'unexpected', 'damaged', 'misplaced'] as ItemStatus[]).map((s) => (
                <option key={s} value={s}>
                  {ITEM_STATUS_LABELS[s]} ({fullData?.items.filter((i) => i.status === s).length ?? 0})
                </option>
              ))}
            </select>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Item</TableHead>
                    <TableHead>Posicion</TableHead>
                    <TableHead>Rack</TableHead>
                    <TableHead>Fila</TableHead>
                    <TableHead>Columna</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Confianza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {fullData ? 'No hay items con este filtro' : 'Cargando datos...'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.slice(0, 100).map((item, idx) => (
                      <TableRow key={`${item.itemId}-${idx}`}>
                        <TableCell className="font-mono text-xs">{item.itemId}</TableCell>
                        <TableCell>{item.position}</TableCell>
                        <TableCell>{item.rack}</TableCell>
                        <TableCell>{item.row}</TableCell>
                        <TableCell>{item.column}</TableCell>
                        <TableCell>
                          <StatusBadge
                            label={ITEM_STATUS_LABELS[item.status]}
                            colorClass={
                              item.status === 'found' ? 'bg-green-500' :
                              item.status === 'missing' ? 'bg-red-500' :
                              item.status === 'unexpected' ? 'bg-purple-500' :
                              item.status === 'damaged' ? 'bg-orange-500' : 'bg-yellow-500'
                            }
                          />
                        </TableCell>
                        <TableCell>{Math.round(item.confidence * 100)}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {filteredItems.length > 100 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Mostrando 100 de {filteredItems.length} items
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discrepancies" className="space-y-4">
          {(!fullData || fullData.discrepancies.length === 0) ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {fullData ? 'No se encontraron discrepancias' : 'Cargando datos...'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {fullData.discrepancies.map((disc) => (
                <Card key={disc.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            label={SEVERITY_LABELS[disc.severity]}
                            colorClass={SEVERITY_COLORS[disc.severity]}
                          />
                          <span className="text-sm font-medium">{disc.type}</span>
                        </div>
                        <p className="text-sm">{disc.description}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Item: {disc.itemId}</span>
                          {disc.expectedPosition && <span>Esperado: {disc.expectedPosition}</span>}
                          {disc.actualPosition && <span>Real: {disc.actualPosition}</span>}
                        </div>
                      </div>
                      {disc.resolved && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={validateOpen}
        onOpenChange={setValidateOpen}
        title="Validar Auditoria"
        description="Al validar, se marcara la auditoria y su tarea asociada como validadas. Esta accion confirma que los resultados han sido revisados y aprobados."
        confirmLabel="Validar Auditoria"
        onConfirm={handleValidate}
        loading={validating}
      />
    </div>
  )
}
