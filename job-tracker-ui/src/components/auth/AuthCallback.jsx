import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      login(token)
    }
    navigate('/', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-500 text-sm">Signing you in…</div>
    </div>
  )
}
