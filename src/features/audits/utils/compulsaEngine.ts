import type { InventoryItem } from '@/types/audit'
import type { WmsRecord, CompulsaEntry, CompulsaResult } from '@/types/compulsa'

export function runCompulsa(
  auditItems: InventoryItem[],
  wmsRecords: WmsRecord[],
  auditId: string,
  performedBy: string
): Omit<CompulsaResult, 'id'> {
  const auditMap = new Map(auditItems.map((item) => [item.itemId, item]))
  const wmsMap = new Map(wmsRecords.map((rec) => [rec.itemId, rec]))
  const allItemIds = new Set([...auditMap.keys(), ...wmsMap.keys()])

  const entries: CompulsaEntry[] = []
  let matchCount = 0

  for (const itemId of allItemIds) {
    const auditItem = auditMap.get(itemId) ?? null
    const wmsRecord = wmsMap.get(itemId) ?? null

    if (!auditItem && wmsRecord) {
      entries.push({
        itemId,
        matchStatus: 'missing_in_audit',
        wmsData: wmsRecord,
        auditData: null,
        details: `Item ${itemId} existe en WMS (posicion ${wmsRecord.position}) pero no fue detectado en la auditoria`,
      })
    } else if (auditItem && !wmsRecord) {
      entries.push({
        itemId,
        matchStatus: 'missing_in_wms',
        wmsData: null,
        auditData: auditItem,
        details: `Item ${itemId} detectado en auditoria (posicion ${auditItem.position}) pero no existe en WMS`,
      })
    } else if (auditItem && wmsRecord) {
      const posMatch = auditItem.position === wmsRecord.position

      if (posMatch) {
        matchCount++
        entries.push({
          itemId,
          matchStatus: 'match',
          wmsData: wmsRecord,
          auditData: auditItem,
          details: `Item ${itemId} coincide en posicion ${auditItem.position}`,
        })
      } else {
        entries.push({
          itemId,
          matchStatus: 'position_mismatch',
          wmsData: wmsRecord,
          auditData: auditItem,
          details: `Item ${itemId}: WMS indica posicion ${wmsRecord.position}, auditoria detecto en ${auditItem.position}`,
        })
      }
    }
  }

  return {
    auditId,
    performedAt: new Date().toISOString(),
    performedBy,
    totalWmsRecords: wmsRecords.length,
    totalAuditItems: auditItems.length,
    matchCount,
    mismatchCount: entries.length - matchCount,
    entries,
  }
}

export function parseWmsCsv(csvText: string): WmsRecord[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const idIdx = headers.findIndex((h) => h.includes('id') || h.includes('item'))
  const posIdx = headers.findIndex((h) => h.includes('pos') || h.includes('ubicacion'))
  const qtyIdx = headers.findIndex((h) => h.includes('qty') || h.includes('cantidad') || h.includes('quantity'))
  const descIdx = headers.findIndex((h) => h.includes('desc'))

  if (idIdx === -1 || posIdx === -1) {
    throw new Error('CSV debe contener columnas de ID y posicion')
  }

  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = line.split(',').map((c) => c.trim())
    return {
      itemId: cols[idIdx] ?? '',
      position: cols[posIdx] ?? '',
      quantity: qtyIdx !== -1 ? Number(cols[qtyIdx]) || 1 : 1,
      lastUpdated: new Date().toISOString(),
      description: descIdx !== -1 ? (cols[descIdx] ?? '') : '',
    }
  })
}
