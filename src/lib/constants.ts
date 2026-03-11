import type { TaskStatus } from '@/types/task'
import type { AuditResultStatus, DiscrepancySeverity, ItemStatus } from '@/types/audit'
import type { CompulsaMatchStatus } from '@/types/compulsa'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  created: 'Creada',
  assigned: 'Asignada',
  in_progress: 'En Progreso',
  completed: 'Completada',
  validated: 'Validada',
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  created: 'bg-gray-500',
  assigned: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
  validated: 'bg-emerald-600',
}

export const AUDIT_STATUS_LABELS: Record<AuditResultStatus, string> = {
  pending_review: 'Pendiente de Revision',
  reviewed: 'Revisada',
  validated: 'Validada',
  rejected: 'Rechazada',
}

export const AUDIT_STATUS_COLORS: Record<AuditResultStatus, string> = {
  pending_review: 'bg-yellow-500',
  reviewed: 'bg-blue-500',
  validated: 'bg-green-500',
  rejected: 'bg-red-500',
}

export const SEVERITY_LABELS: Record<DiscrepancySeverity, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Critica',
}

export const SEVERITY_COLORS: Record<DiscrepancySeverity, string> = {
  low: 'bg-gray-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-600',
}

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  found: 'Encontrado',
  missing: 'Faltante',
  unexpected: 'Inesperado',
  damaged: 'Danado',
  misplaced: 'Mal ubicado',
}

export const COMPULSA_STATUS_LABELS: Record<CompulsaMatchStatus, string> = {
  match: 'Coincide',
  position_mismatch: 'Posicion diferente',
  quantity_mismatch: 'Cantidad diferente',
  missing_in_audit: 'Falta en auditoria',
  missing_in_wms: 'Falta en WMS',
  multiple_mismatch: 'Multiples diferencias',
}

export const STORAGE_TYPE_LABELS = {
  racks: 'Racks',
  shelves: 'Estantes',
  floor: 'Piso',
  mixed: 'Mixto',
} as const
