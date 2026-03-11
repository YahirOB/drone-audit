import type { FirestoreTimestamp } from './common'

export type TaskStatus =
  | 'created'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'validated'

export type StorageType = 'racks' | 'shelves' | 'floor' | 'mixed'

export interface PositionRange {
  from: string
  to: string
}

export interface TaskConfig {
  storageType: StorageType
  rowSize: number
  columnSize: number
  idLength: number
  locationName: string
}

export interface AuditTask {
  id: string
  title: string
  warehouseLocation: string
  aisle: string
  positionRange: PositionRange
  config: TaskConfig
  status: TaskStatus
  createdBy: string
  assignedTo: string | null
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
  completedAt: FirestoreTimestamp | null
  validatedAt: FirestoreTimestamp | null
  auditResultId: string | null
  notes: string
}
