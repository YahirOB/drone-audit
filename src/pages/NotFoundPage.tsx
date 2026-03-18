import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Pagina no encontrada</h1>
      <p className="text-muted-foreground">La pagina que buscas no existe.</p>
      <Link to="/" className={buttonVariants()}>
        Volver al inicio
      </Link>
    </div>
  )
}
