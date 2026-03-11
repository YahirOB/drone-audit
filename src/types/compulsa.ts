import type { InventoryItem } from './audit'

export interface WmsRecord {
  itemId: string
  position: string
  quantity: number
  lastUpdated: string
  description: string
}

export type CompulsaMatchStatus =
  | 'match'
  | 'position_mismatch'
  | 'quantity_mismatch'
  | 'missing_in_audit'
  | 'missing_in_wms'
  | 'multiple_mismatch'

export interface CompulsaEntry {
  itemId: string
  matchStatus: CompulsaMatchStatus
  wmsData: WmsRecord | null
  auditData: InventoryItem | null
  details: string
}

export interface CompulsaResult {
  id: string
  auditId: string
  performedAt: string
  performedBy: string
  totalWmsRecords: number
  totalAuditItems: number
  matchCount: number
  mismatchCount: number
  entries: CompulsaEntry[]
}
