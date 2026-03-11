import * as XLSX from 'xlsx'
import type { AuditExportData } from '@/types/audit'

export function exportAuditToExcel(data: AuditExportData): void {
  const wb = XLSX.utils.book_new()

  const metaSheet = XLSX.utils.json_to_sheet([
    {
      'ID Auditoria': data.metadata.auditId,
      Operador: data.metadata.operatorName,
      Ubicacion: data.metadata.warehouseLocation,
      Pasillo: data.metadata.aisle,
      'Rango Desde': data.metadata.positionRange.from,
      'Rango Hasta': data.metadata.positionRange.to,
      'Inicio': data.metadata.startedAt,
      'Fin': data.metadata.completedAt,
      'Modelo Drone': data.metadata.droneModel,
      'Posiciones Escaneadas': data.summary.totalPositionsScanned,
      'Items Detectados': data.summary.totalItemsDetected,
      'Discrepancias': data.summary.totalDiscrepancies,
      'Cobertura (%)': data.summary.coveragePercent,
      'Duracion (min)': data.summary.scanDurationMinutes,
    },
  ])
  XLSX.utils.book_append_sheet(wb, metaSheet, 'Resumen')

  const itemsSheet = XLSX.utils.json_to_sheet(
    data.items.map((item) => ({
      'ID Item': item.itemId,
      Posicion: item.position,
      Rack: item.rack,
      Fila: item.row,
      Columna: item.column,
      Estado: item.status,
      Confianza: `${Math.round(item.confidence * 100)}%`,
      'Detectado En': item.detectedAt,
      Notas: item.notes,
    }))
  )
  XLSX.utils.book_append_sheet(wb, itemsSheet, 'Inventario')

  const discSheet = XLSX.utils.json_to_sheet(
    data.discrepancies.map((d) => ({
      Tipo: d.type,
      Severidad: d.severity,
      'ID Item': d.itemId,
      'Posicion Esperada': d.expectedPosition ?? '',
      'Posicion Real': d.actualPosition ?? '',
      'Cantidad Esperada': d.expectedQuantity ?? '',
      'Cantidad Real': d.actualQuantity ?? '',
      Descripcion: d.description,
      Resuelto: d.resolved ? 'Si' : 'No',
    }))
  )
  XLSX.utils.book_append_sheet(wb, discSheet, 'Discrepancias')

  const filename = `auditoria-${data.metadata.auditId}-${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, filename)
}
