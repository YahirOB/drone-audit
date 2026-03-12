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
import { DEMO_TASKS } from '@/lib/mock-data'
import type { AuditTask, TaskStatus } from '@/types/task'

const DEMO_MODE = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key'
const TASKS_COLLECTION = 'tasks'

const demoTasks = [...DEMO_TASKS]

export async function createTask(
  task: Omit<AuditTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'validatedAt' | 'auditResultId' | 'assignedTo'>
): Promise<string> {
  if (DEMO_MODE) {
    const id = `task-${String(demoTasks.length + 1).padStart(3, '0')}`
    const now = Timestamp.now()
    demoTasks.unshift({
      ...task,
      id,
      assignedTo: null,
      auditResultId: null,
      completedAt: null,
      validatedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    return id
  }

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
  if (DEMO_MODE) {
    return demoTasks.find((t) => t.id === taskId) ?? null
  }
  const snap = await getDoc(doc(db, TASKS_COLLECTION, taskId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as AuditTask
}

export async function getTasks(filters?: {
  status?: TaskStatus
  createdBy?: string
}): Promise<AuditTask[]> {
  if (DEMO_MODE) {
    let result = [...demoTasks]
    if (filters?.status) result = result.filter((t) => t.status === filters.status)
    if (filters?.createdBy) result = result.filter((t) => t.createdBy === filters.createdBy)
    return result
  }

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
  if (DEMO_MODE) {
    const task = demoTasks.find((t) => t.id === taskId)
    if (task) {
      task.status = status
      task.updatedAt = Timestamp.now()
      if (status === 'completed') task.completedAt = Timestamp.now()
      if (status === 'validated') task.validatedAt = Timestamp.now()
    }
    return
  }

  const updates: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  }
  if (status === 'completed') updates.completedAt = serverTimestamp()
  if (status === 'validated') updates.validatedAt = serverTimestamp()

  await updateDoc(doc(db, TASKS_COLLECTION, taskId), updates)
}

export async function updateTask(
  taskId: string,
  data: Partial<Omit<AuditTask, 'id' | 'createdAt'>>
): Promise<void> {
  if (DEMO_MODE) {
    const idx = demoTasks.findIndex((t) => t.id === taskId)
    if (idx !== -1) {
      demoTasks[idx] = { ...demoTasks[idx], ...data, updatedAt: Timestamp.now() }
    }
    return
  }

  await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}
