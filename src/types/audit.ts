import type { FirestoreTimestamp } from './common'
import type { PositionRange, TaskConfig } from './task'

export type ItemStatus =
  | 'found'
  | 'missing'
  | 'unexpected'
  | 'damaged'
  | 'misplaced'

export type DiscrepancyType =
  | 'missing_item'
  | 'extra_item'
  | 'wrong_position'
  | 'wrong_quantity'
  | 'damaged'
  | 'id_mismatch'

export type DiscrepancySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface InventoryItem {
  itemId: string
  position: string
  rack: string
  row: number
  column: number
  status: ItemStatus
  confidence: number
  detectedAt: string
  imageRef: string | null
  notes: string
}

export interface Discrepancy {
  id: string
  type: DiscrepancyType
  severity: DiscrepancySeverity
  itemId: string
  expectedPosition: string | null
  actualPosition: string | null
  expectedQuantity: number | null
  actualQuantity: number | null
  description: string
  resolved: boolean
  resolvedBy: string | null
  resolvedAt: string | null
  resolutionNotes: string | null
}

export interface AuditMetadata {
  auditId: string
  taskId: string
  operatorId: string
  operatorName: string
  startedAt: string
  completedAt: string
  droneModel: string
  softwareVersion: string
  warehouseLocation: string
  aisle: string
  positionRange: PositionRange
  config: TaskConfig
}

export interface BackupReference {
  type: 'image' | 'video' | 'log' | 'raw_data'
  filename: string
  storagePath: string
  sizeBytes: number
  uploadedAt: string
  checksum: string
}

export interface AuditExportData {
  version: string
  metadata: AuditMetadata
  summary: {
    totalPositionsScanned: number
    totalItemsDetected: number
    totalDiscrepancies: number
    scanDurationMinutes: number
    coveragePercent: number
  }
  items: InventoryItem[]
  discrepancies: Discrepancy[]
  backups: BackupReference[]
}

export type AuditResultStatus = 'pending_review' | 'reviewed' | 'validated' | 'rejected'

export interface AuditResult {
  id: string
  taskId: string
  exportDataPath: string
  metadata: AuditMetadata
  summary: AuditExportData['summary']
  discrepancySummary: {
    total: number
    bySeverity: Record<DiscrepancySeverity, number>
    byType: Record<DiscrepancyType, number>
  }
  status: AuditResultStatus
  reviewedBy: string | null
  reviewedAt: FirestoreTimestamp | null
  validatedBy: string | null
  validatedAt: FirestoreTimestamp | null
  reviewNotes: string
  uploadedAt: FirestoreTimestamp
}
