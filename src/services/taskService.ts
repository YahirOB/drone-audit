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
import type { AuditTask, TaskStatus } from '@/types/task'

const TASKS_COLLECTION = 'tasks'

export async function createTask(
  task: Omit<AuditTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'validatedAt' | 'auditResultId' | 'assignedTo'>
): Promise<string> {
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
    ...task,
    status: 'created' as TaskStatus,
    assignedTo: null,
    auditResultId: null,
    completedAt: null,
    validatedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getTask(taskId: string): Promise<AuditTask | null> {
  const snap = await getDoc(doc(db, TASKS_COLLECTION, taskId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as AuditTask
}

export async function getTasks(filters?: {
  status?: TaskStatus
  createdBy?: string
}): Promise<AuditTask[]> {
  const constraints: QueryConstraint[] = [orderBy('updatedAt', 'desc')]

  if (filters?.status) {
    constraints.unshift(where('status', '==', filters.status))
  }
  if (filters?.createdBy) {
    constraints.unshift(where('createdBy', '==', filters.createdBy))
  }

  const q = query(collection(db, TASKS_COLLECTION), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditTask)
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  }

  if (status === 'completed') {
    updates.completedAt = serverTimestamp()
  }
  if (status === 'validated') {
    updates.validatedAt = serverTimestamp()
  }

  await updateDoc(doc(db, TASKS_COLLECTION, taskId), updates)
}

export async function updateTask(
  taskId: string,
  data: Partial<Omit<AuditTask, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}
