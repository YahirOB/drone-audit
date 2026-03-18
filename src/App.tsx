import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RootLayout } from '@/components/layout/RootLayout'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TaskListPage } from '@/pages/tasks/TaskListPage'
import { TaskCreatePage } from '@/pages/tasks/TaskCreatePage'
import { TaskDetailPage } from '@/pages/tasks/TaskDetailPage'
import { AuditListPage } from '@/pages/audits/AuditListPage'
import { AuditReviewPage } from '@/pages/audits/AuditReviewPage'
import { AuditCompulsaPage } from '@/pages/audits/AuditCompulsaPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useAuthStore } from '@/stores/authStore'
import { subscribeToAuthState, fetchUserProfile, isDemoMode } from '@/services/authService'
import { DEMO_USER } from '@/lib/mock-data'

function AuthInit() {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    if (isDemoMode()) {
      const loggedIn = sessionStorage.getItem('demo_logged_in') === 'true'
      setUser(loggedIn ? DEMO_USER : null)
      setLoading(false)
      return
    }

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const appUser = await fetchUserProfile(firebaseUser.uid)
          if (appUser && appUser.role === 'supervisor') {
            setUser(appUser)
          } else {
            setUser(null)
          }
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [setUser, setLoading])

  return null
}

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <AuthInit />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RootLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tasks" element={<TaskListPage />} />
              <Route path="/tasks/new" element={<TaskCreatePage />} />
              <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
              <Route path="/audits" element={<AuditListPage />} />
              <Route path="/audits/:auditId/review" element={<AuditReviewPage />} />
              <Route path="/audits/:auditId/compulsa" element={<AuditCompulsaPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </TooltipProvider>
  )
}
