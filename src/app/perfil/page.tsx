'use client'

import { Suspense, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useApp } from '@/contexts/AppContext'
import GoogleCalendarConnect from '@/components/GoogleCalendarConnect'
import { UserCircle, Mail, Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  sdr: 'SDR',
  marketing: 'Marketing',
}

function AlterarSenhaSection() {
  const { currentUser, updateUser } = useApp()

  const [senhaAtual, setSenhaAtual]       = useState('')
  const [novaSenha, setNovaSenha]         = useState('')
  const [confirmar, setConfirmar]         = useState('')
  const [showAtual, setShowAtual]         = useState(false)
  const [showNova, setShowNova]           = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [status, setStatus]               = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]           = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setErrorMsg('')

    if (novaSenha.length < 6) {
      setErrorMsg('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setErrorMsg('As senhas não conferem.')
      return
    }

    setStatus('loading')

    // Verifica senha atual contra o banco
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', currentUser.id)
      .eq('senha', senhaAtual)
      .maybeSingle()

    if (error || !data) {
      setStatus('error')
      setErrorMsg('Senha atual incorreta.')
      return
    }

    await updateUser(currentUser.id, {}, novaSenha)

    setStatus('success')
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmar('')

    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
      {/* Senha atual */}
      <div>
        <label className="block text-xs font-semibold text-[#6B7C93] mb-1.5">Senha atual</label>
        <div className="relative">
          <input
            type={showAtual ? 'text' : 'password'}
            className="input text-sm pr-10"
            placeholder="••••••••"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            required
          />
          <button type="button" onClick={() => setShowAtual((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#6B7C93] transition-colors">
            {showAtual ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Nova senha */}
      <div>
        <label className="block text-xs font-semibold text-[#6B7C93] mb-1.5">Nova senha</label>
        <div className="relative">
          <input
            type={showNova ? 'text' : 'password'}
            className="input text-sm pr-10"
            placeholder="Mínimo 6 caracteres"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
          />
          <button type="button" onClick={() => setShowNova((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#6B7C93] transition-colors">
            {showNova ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Confirmar nova senha */}
      <div>
        <label className="block text-xs font-semibold text-[#6B7C93] mb-1.5">Confirmar nova senha</label>
        <div className="relative">
          <input
            type={showConfirmar ? 'text' : 'password'}
            className="input text-sm pr-10"
            placeholder="Repita a nova senha"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
          />
          <button type="button" onClick={() => setShowConfirmar((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#6B7C93] transition-colors">
            {showConfirmar ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {novaSenha && confirmar && novaSenha !== confirmar && (
          <p className="text-xs text-red-500 mt-1">As senhas não conferem.</p>
        )}
        {novaSenha && confirmar && novaSenha === confirmar && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle size={11} /> Senhas conferem
          </p>
        )}
      </div>

      {/* Feedback */}
      {status === 'error' && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <span className="text-red-700 text-xs">{errorMsg}</span>
        </div>
      )}
      {status === 'success' && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
          <span className="text-green-700 text-xs font-semibold">Senha alterada com sucesso!</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !senhaAtual || !novaSenha || !confirmar}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
        style={{
          background: status === 'loading' || !senhaAtual || !novaSenha || !confirmar
            ? '#E0E6ED'
            : 'linear-gradient(135deg,#2FBF71,#1E8E5A)',
          color: status === 'loading' || !senhaAtual || !novaSenha || !confirmar ? '#A0AEC0' : '#fff',
          cursor: status === 'loading' || !senhaAtual || !novaSenha || !confirmar ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'loading' ? 'Alterando...' : 'Alterar senha'}
      </button>
    </form>
  )
}

function PerfilContent() {
  const { currentUser } = useApp()

  if (!currentUser) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-bold text-[#1F2D3D]">Meu Perfil</h1>

      {/* Minha Conta */}
      <section className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E0E6ED' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #E0E6ED' }}>
          <h2 className="text-sm font-semibold text-[#1F2D3D] flex items-center gap-2">
            <UserCircle size={16} className="text-[#3B82F6]" />
            Minha Conta
          </h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#2FBF71,#1E8E5A)' }}
            >
              {currentUser.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[#1F2D3D]">{currentUser.nome}</p>
              <p className="text-xs text-[#6B7C93] flex items-center gap-1 mt-0.5">
                <Mail size={11} /> {currentUser.email}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{ background: '#F5F7FA', border: '1px solid #E0E6ED' }}
          >
            <Shield size={14} style={{ color: '#A0AEC0' }} />
            <span className="text-[#6B7C93]">Perfil:</span>
            <span className="font-semibold text-[#1F2D3D]">{ROLE_LABELS[currentUser.tipo] ?? currentUser.tipo}</span>
          </div>
        </div>
      </section>

      {/* Alterar Senha */}
      <section className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E0E6ED' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #E0E6ED' }}>
          <h2 className="text-sm font-semibold text-[#1F2D3D] flex items-center gap-2">
            <Lock size={16} className="text-[#6B7C93]" />
            Alterar Senha
          </h2>
        </div>
        <AlterarSenhaSection />
      </section>

      {/* Google Calendar */}
      <section className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E0E6ED' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #E0E6ED' }}>
          <h2 className="text-sm font-semibold text-[#1F2D3D] flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#4285F4">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google Calendar
          </h2>
          <p className="text-xs text-[#6B7C93] mt-1">
            Conecte sua conta Google para criar eventos automaticamente ao agendar reuniões.
          </p>
        </div>
        <div className="px-5 py-4">
          <GoogleCalendarConnect redirectTo="/perfil" />
        </div>
      </section>
    </div>
  )
}

export default function PerfilPage() {
  return (
    <AppShell>
      <Suspense>
        <PerfilContent />
      </Suspense>
    </AppShell>
  )
}
