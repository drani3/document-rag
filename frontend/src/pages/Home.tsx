import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/http'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'

type MeResponse = {
  id: string
  email: string
}

export function Home() {
  const navigate = useNavigate()
  const session = useSession()
  const [backendUser, setBackendUser] = useState<MeResponse | null>(null)
  const [backendError, setBackendError] = useState<string | null>(null)
  const [isLoadingBackend, setIsLoadingBackend] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadMe() {
      setIsLoadingBackend(true)
      setBackendError(null)

      try {
        const user = await api.get<MeResponse>('/me')
        if (mounted) {
          setBackendUser(user)
        }
      } catch (error) {
        if (!mounted) {
          return
        }

        if (error instanceof ApiError) {
          setBackendError(error.message)
        } else {
          setBackendError('Could not reach the backend.')
        }
      } finally {
        if (mounted) {
          setIsLoadingBackend(false)
        }
      }
    }

    if (session) {
      void loadMe()
    }

    return () => {
      mounted = false
    }
  }, [session])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Document Copilot</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {session?.user.email ?? 'unknown'}
          </p>
        </div>
        <Button variant="outline" onClick={() => void handleSignOut()}>
          Sign out
        </Button>
      </div>

      <section className="rounded-xl border bg-card p-4 text-card-foreground">
        <h2 className="text-sm font-medium">Backend auth check</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This calls <code className="text-foreground">GET /me</code> with your Supabase token.
        </p>

        {isLoadingBackend ? (
          <p className="mt-3 text-sm text-muted-foreground">Verifying token with backend…</p>
        ) : null}

        {!isLoadingBackend && backendUser ? (
          <p className="mt-3 text-sm text-foreground">
            Backend verified <span className="font-medium">{backendUser.email}</span> (
            {backendUser.id})
          </p>
        ) : null}

        {!isLoadingBackend && backendError ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {backendError}
          </p>
        ) : null}
      </section>
    </div>
  )
}
