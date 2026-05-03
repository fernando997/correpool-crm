'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Calendar, LogOut } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

interface Props {
  compact?: boolean
  redirectTo?: string
}

export default function GoogleCalendarConnect({ compact, redirectTo }: Props) {
  const { currentUser, googleConnected, refreshGoogleConnection } = useApp()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('google_connected') === '1') {
      refreshGoogleConnection()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentUser) return null

  const handleConnect = () => {
    const dest = redirectTo ?? (typeof window !== 'undefined' ? window.location.pathname : '/perfil')
    window.location.href = `/api/google/auth?user_id=${currentUser.id}&redirect_to=${encodeURIComponent(dest)}`
  }

  const handleDisconnect = async () => {
    await fetch('/api/google/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id }),
    })
    await refreshGoogleConnection()
  }

  if (googleConnected) {
    return (
      <div
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
        style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
      >
        <CheckCircle size={compact ? 14 : 16} style={{ color: '#16A34A', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-[#166534] ${compact ? 'text-xs' : 'text-sm'}`}>
            Google Calendar conectado
          </p>
          {currentUser.google_email && (
            <p className="text-[10px] text-[#4ADE80] truncate">{currentUser.google_email}</p>
          )}
        </div>
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-1 text-[10px] font-semibold text-[#6B7C93] hover:text-red-500 transition-colors flex-shrink-0"
        >
          <LogOut size={11} />
          {!compact && 'Desconectar'}
        </button>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl px-3 py-2.5 space-y-2"
      style={{ background: '#F5F7FA', border: '1px solid #E0E6ED' }}
    >
      <div className="flex items-center gap-2">
        <Calendar size={compact ? 14 : 16} style={{ color: '#A0AEC0', flexShrink: 0 }} />
        <p className={`text-[#6B7C93] ${compact ? 'text-xs' : 'text-sm'}`}>
          Google Calendar não conectado
        </p>
      </div>
      <button
        onClick={handleConnect}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#4285F4,#1A73E8)', color: '#fff' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Conectar Google Calendar
      </button>
    </div>
  )
}
