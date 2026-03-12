import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DEMO_AUDIT_RESULTS, DEMO_FULL_AUDIT_DATA } from '@/lib/mock-data'
import type { AuditResult, AuditResultStatus, AuditExportData } from '@/types/audit'
import type { CompulsaResult } from '@/types/compulsa'
import { downloadFileBlob } from './storageService'

const DEMO_MODE = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key'
const AUDIT_RESULTS_COLLECTION = 'auditResults'

const demoAudits = [...DEMO_AUDIT_RESULTS]

export async function getAuditResult(resultId: string): Promise<AuditResult | null> {
  if (DEMO_MODE) {
    return demoAudits.find((a) => a.id === resultId) ?? null
  }
  const snap = await getDoc(doc(db, AUDIT_RESULTS_COLLECTION, resultId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as AuditResult
}

export async function getAuditResults(filters?: {
  status?: AuditResultStatus
  taskId?: string
}): Promise<AuditResult[]> {
  if (DEMO_MODE) {
    let result = [...demoAudits]
    if (filters?.status) result = result.filter((a) => a.status === filters.status)
    if (filters?.taskId) result = result.filter((a) => a.taskId === filters.taskId)
    return result
  }

  const constraints: QueryConstraint[] = [orderBy('uploadedAt', 'desc')]
  if (filters?.status) {
    constraints.unshift(where('status', '==', filters.status))
  }
  if (filters?.taskId) {
    constraints.unshift(where('taskId', '==', filters.taskId))
  }

  const q = query(collection(db, AUDIT_RESULTS_COLLECTION), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditResult)
}

export async function fetchFullAuditData(
  exportDataPath: string
): Promise<AuditExportData> {
  if (DEMO_MODE) {
    if (exportDataPath.includes('audit-001')) return DEMO_FULL_AUDIT_DATA
    return {
      ...DEMO_FULL_AUDIT_DATA,
      metadata: DEMO_AUDIT_RESULTS[1].metadata,
      summary: DEMO_AUDIT_RESULTS[1].summary,
      items: DEMO_FULL_AUDIT_DATA.items.slice(0, 58),
      discrepancies: DEMO_FULL_AUDIT_DATA.discrepancies.slice(0, 2),
    }
  }

  const blob = await downloadFileBlob(exportDataPath)
  const text = await blob.text()
  return JSON.parse(text) as AuditExportData
}

export async function updateAuditStatus(
  resultId: string,
  status: AuditResultStatus,
  userId: string,
  notes?: string
): Promise<void> {
  if (DEMO_MODE) {
    const audit = demoAudits.find((a) => a.id === resultId)
    if (audit) {
      audit.status = status
      if (status === 'reviewed') {
        audit.reviewedBy = userId
        audit.reviewedAt = Timestamp.now()
      }
      if (status === 'validated' || status === 'rejected') {
        audit.validatedBy = userId
        audit.validatedAt = Timestamp.now()
      }
      if (notes !== undefined) audit.reviewNotes = notes
    }
    return
  }

  const updates: Record<string, unknown> = { status }
  if (status === 'reviewed') {
    updates.reviewedBy = userId
    updates.reviewedAt = serverTimestamp()
  }
  if (status === 'validated' || status === 'rejected') {
    updates.validatedBy = userId
    updates.validatedAt = serverTimestamp()
  }
  if (notes !== undefined) updates.reviewNotes = notes

  await updateDoc(doc(db, AUDIT_RESULTS_COLLECTION, resultId), updates)
}

export async function saveCompulsaResult(
  auditResultId: string,
  result: Omit<CompulsaResult, 'id'>
): Promise<string> {
  if (DEMO_MODE) {
    return `compulsa-${Date.now()}`
  }

  const docRef = await addDoc(
    collection(db, AUDIT_RESULTS_COLLECTION, auditResultId, 'compulsaResults'),
    result
  )
  return docRef.id
}

export async function getCompulsaResults(
  auditResultId: string
): Promise<CompulsaResult[]> {
  if (DEMO_MODE) return []

  const q = query(
    collection(db, AUDIT_RESULTS_COLLECTION, auditResultId, 'compulsaResults'),
    orderBy('performedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CompulsaResult)
}
