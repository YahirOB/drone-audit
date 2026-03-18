import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { getAuditResult, fetchFullAuditData, saveCompulsaResult } from '@/services/auditService'
import { runCompulsa, parseWmsCsv } from '@/features/audits/utils/compulsaEngine'
import { useAuthStore } from '@/stores/authStore'
import { COMPULSA_STATUS_LABELS } from '@/lib/constants'
import type { AuditResult, AuditExportData } from '@/types/audit'
import type { CompulsaEntry, WmsRecord } from '@/types/compulsa'
import { toast } from 'sonner'

export function AuditCompulsaPage() {
  const { auditId } = useParams<{ auditId: string }>()
  const user = useAuthStore((s) => s.user)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [fullData, setFullData] = useState<AuditExportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<CompulsaEntry[] | null>(null)
  const [matchCount, setMatchCount] = useState(0)
  const [mismatchCount, setMismatchCount] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fullData || !user) return

    setProcessing(true)
    try {
      const text = await file.text()
      let wmsRecords: WmsRecord[]

      if (file.name.endsWith('.json')) {
        wmsRecords = JSON.parse(text) as WmsRecord[]
      } else {
        wmsRecords = parseWmsCsv(text)
      }

      if (wmsRecords.length === 0) {
        toast.error('No se encontraron registros en el archivo')
        return
      }

      const compulsaResult = runCompulsa(
        fullData.items,
        wmsRecords,
        fullData.metadata.auditId,
        user.uid
      )

      setEntries(compulsaResult.entries)
      setMatchCount(compulsaResult.matchCount)
      setMismatchCount(compulsaResult.mismatchCount)

      if (result) {
        try {
          await saveCompulsaResult(result.id, compulsaResult)
          toast.success(`Compulsa completada: ${compulsaResult.matchCount} coincidencias, ${compulsaResult.mismatchCount} discrepancias`)
        } catch {
          toast.success('Compulsa completada (no guardada en nube)')
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al procesar el archivo')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Auditoria no encontrada</p>
        <Link to="/audits" className={buttonVariants({ className: 'mt-4' })}>
          Volver
        </Link>
      </div>
    )
  }

  const filteredEntries = entries
    ? filterStatus === 'all'
      ? entries
      : entries.filter((e) => e.matchStatus === filterStatus)
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to={`/audits/${auditId}/review`} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Compulsa</h1>
          <p className="text-sm text-muted-foreground">
            Comparar datos de auditoria con inventario WMS
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subir Datos WMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sube un archivo CSV o JSON con los datos del sistema WMS. El CSV debe tener columnas de ID y posicion.
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              disabled={processing || !fullData}
              className="max-w-sm"
            />
            {processing && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Upload className="h-4 w-4 animate-pulse" />
                Procesando...
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {entries && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{matchCount}</p>
                  <p className="text-xs text-muted-foreground">Coincidencias</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{mismatchCount}</p>
                  <p className="text-xs text-muted-foreground">Discrepancias</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{entries.length}</p>
                  <p className="text-xs text-muted-foreground">Total Comparados</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="text-sm border rounded px-2 py-1 bg-background"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos ({entries.length})</option>
              <option value="match">Coincide ({entries.filter((e) => e.matchStatus === 'match').length})</option>
              <option value="position_mismatch">Posicion diferente ({entries.filter((e) => e.matchStatus === 'position_mismatch').length})</option>
              <option value="missing_in_audit">Falta en auditoria ({entries.filter((e) => e.matchStatus === 'missing_in_audit').length})</option>
              <option value="missing_in_wms">Falta en WMS ({entries.filter((e) => e.matchStatus === 'missing_in_wms').length})</option>
            </select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Item</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Posicion WMS</TableHead>
                    <TableHead>Posicion Auditoria</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.slice(0, 100).map((entry, idx) => (
                    <TableRow key={`${entry.itemId}-${idx}`}>
                      <TableCell className="font-mono text-xs">{entry.itemId}</TableCell>
                      <TableCell>
                        <StatusBadge
                          label={COMPULSA_STATUS_LABELS[entry.matchStatus]}
                          colorClass={
                            entry.matchStatus === 'match' ? 'bg-green-500' :
                            entry.matchStatus === 'missing_in_audit' ? 'bg-red-500' :
                            entry.matchStatus === 'missing_in_wms' ? 'bg-purple-500' : 'bg-yellow-500'
                          }
                        />
                      </TableCell>
                      <TableCell className="text-sm">{entry.wmsData?.position ?? '-'}</TableCell>
                      <TableCell className="text-sm">{entry.auditData?.position ?? '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{entry.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredEntries.length > 100 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Mostrando 100 de {filteredEntries.length} registros
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
