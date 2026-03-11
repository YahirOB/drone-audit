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
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AuditResult, AuditResultStatus, AuditExportData } from '@/types/audit'
import type { CompulsaResult } from '@/types/compulsa'
import { downloadFileBlob } from './storageService'

const AUDIT_RESULTS_COLLECTION = 'auditResults'

export async function getAuditResult(resultId: string): Promise<AuditResult | null> {
  const snap = await getDoc(doc(db, AUDIT_RESULTS_COLLECTION, resultId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as AuditResult
}

export async function getAuditResults(filters?: {
  status?: AuditResultStatus
  taskId?: string
}): Promise<AuditResult[]> {
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
  const updates: Record<string, unknown> = { status }

  if (status === 'reviewed') {
    updates.reviewedBy = userId
    updates.reviewedAt = serverTimestamp()
  }
  if (status === 'validated' || status === 'rejected') {
    updates.validatedBy = userId
    updates.validatedAt = serverTimestamp()
  }
  if (notes !== undefined) {
    updates.reviewNotes = notes
  }

  await updateDoc(doc(db, AUDIT_RESULTS_COLLECTION, resultId), updates)
}

export async function saveCompulsaResult(
  auditResultId: string,
  result: Omit<CompulsaResult, 'id'>
): Promise<string> {
  const docRef = await addDoc(
    collection(db, AUDIT_RESULTS_COLLECTION, auditResultId, 'compulsaResults'),
    result
  )
  return docRef.id
}

export async function getCompulsaResults(
  auditResultId: string
): Promise<CompulsaResult[]> {
  const q = query(
    collection(db, AUDIT_RESULTS_COLLECTION, auditResultId, 'compulsaResults'),
    orderBy('performedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CompulsaResult)
}
