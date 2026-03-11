import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { FileSearch } from 'lucide-react'
import { getAuditResults } from '@/services/auditService'
import { AUDIT_STATUS_LABELS, AUDIT_STATUS_COLORS } from '@/lib/constants'
import type { AuditResult, AuditResultStatus } from '@/types/audit'

export function AuditListPage() {
  const [audits, setAudits] = useState<AuditResult[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function load() {
      try {
        const data = await getAuditResults()
        setAudits(data)
      } catch {
        // Firebase not configured
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = statusFilter === 'all'
    ? audits
    : audits.filter((a) => a.status === statusFilter)

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Auditorias</h1>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {(Object.entries(AUDIT_STATUS_LABELS) as [AuditResultStatus, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} auditorias</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="Sin auditorias"
          description="Las auditorias apareceran cuando los operadores suban sus resultados"
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((audit) => (
            <Link key={audit.id} to={`/audits/${audit.id}/review`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {audit.metadata.warehouseLocation} - Pasillo {audit.metadata.aisle}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Operador: {audit.metadata.operatorName}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{audit.summary.totalItemsDetected} items</span>
                      <span>{audit.summary.totalDiscrepancies} discrepancias</span>
                      <span>{audit.summary.coveragePercent}% cobertura</span>
                    </div>
                  </div>
                  <StatusBadge
                    label={AUDIT_STATUS_LABELS[audit.status]}
                    colorClass={AUDIT_STATUS_COLORS[audit.status]}
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
