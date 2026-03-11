import {
  ref,
  uploadBytes,
  getDownloadURL,
  getBlob,
} from 'firebase/storage'
import { storage } from '@/lib/firebase'

export async function uploadFile(
  path: string,
  file: File | Blob
): Promise<string> {
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function downloadFileUrl(path: string): Promise<string> {
  return getDownloadURL(ref(storage, path))
}

export async function downloadFileBlob(path: string): Promise<Blob> {
  return getBlob(ref(storage, path))
}

export async function uploadAuditJson(
  auditId: string,
  jsonData: string
): Promise<string> {
  const blob = new Blob([jsonData], { type: 'application/json' })
  return uploadFile(`audits/${auditId}/export-data.json`, blob)
}

export async function getAuditJsonUrl(auditId: string): Promise<string> {
  return downloadFileUrl(`audits/${auditId}/export-data.json`)
}
