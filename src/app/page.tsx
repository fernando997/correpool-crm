'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, Mail, Lock, BarChart2, Users, Zap } from 'lucide-react'
import Image from 'next/image'
import { useApp } from '@/contexts/AppContext'

export default function LoginPage() {
  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const { login } = useApp()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const tipo = await login(email, senha)
    setLoading(false)
    if (tipo) {
      router.push(tipo === 'marketing' ? '/marketing' : '/dashboard')
    } else {
      setError('Email ou senha incorretos.')
    }
  }

  const FEATURES = [
    {
      icon: BarChart2,
      title: 'Funil Kanban',
      desc: 'Acompanhe cada lead em tempo real',
    },
    {
      icon: Zap,
      title: 'Análise de Criativos',
      desc: 'Saiba quais campanhas convertem',
    },
    {
      icon: Users,
      title: 'Performance de Equipe',
      desc: 'Rankings e metas por vendedor',
    },
  ]

  return (
    <div className="min-h-screen flex">

      {/* ── Coluna esquerda — painel de marca ─────────────────────────── */}
      <div
        className="hidden md:flex md:w-1/2 flex-col justify-center px-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0F2419 0%, #1A3D28 45%, #0D3320 100%)' }}
      >
        {/* Decorações geométricas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, #2FBF71 0%, transparent 65%)' }}
          />
          <div
            className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full blur-3xl opacity-15"
            style={{ background: 'radial-gradient(circle, #1E8E5A 0%, transparent 65%)' }}
          />
          <div
            className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full blur-3xl opacity-10"
            style={{ background: 'radial-gradient(circle, #4ADE80 0%, transparent 60%)' }}
          />
          {/* Grid pattern sutil */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-md">
          {/* Logo */}
          <div className="mb-10">
            <Image
              src="/logo.png"
              alt="Modo Corre"
              width={280}
              height={98}
              className="object-contain brightness-0 invert"
              style={{ maxHeight: '98px' }}
              priority
            />
          </div>

          {/* Tagline */}
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
            Gestão inteligente<br />de leads e vendas
          </h1>
          <p className="text-[#86EFAC] text-sm mb-10">
            Tudo que sua equipe comercial precisa em um só lugar.
          </p>

          {/* Features */}
          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(47,191,113,0.18)', border: '1px solid rgba(47,191,113,0.25)' }}
                >
                  <Icon size={18} style={{ color: '#4ADE80' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-[#86EFAC] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Coluna direita — formulário ────────────────────────────────── */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 relative"
        style={{ background: '#FFFFFF' }}>

        {/* Logo mobile (oculta em desktop) */}
        <div className="md:hidden mb-8">
          <Image
            src="/logo.png"
            alt="Modo Corre"
            width={200}
            height={70}
            className="object-contain"
            style={{ maxHeight: '70px' }}
            priority
          />
        </div>

        <div className="w-full max-w-sm">
          {/* Cabeçalho */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-[#1F2D3D]">Bem-vindo de volta</h2>
            <p className="text-sm text-[#6B7C93] mt-1.5">
              Entre com suas credenciais para acessar o painel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label block mb-1.5">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail size={16} style={{ color: '#A0AEC0' }} />
                </span>
                <input
                  type="email"
                  className="input pl-9"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="label block mb-1.5">Senha</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock size={16} style={{ color: '#A0AEC0' }} />
                </span>
                <input
                  type={showSenha ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#6B7C93] transition-colors"
                  onClick={() => setShowSenha(!showSenha)}
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div
                className="flex items-center gap-2 text-red-500 text-sm px-3 py-2.5 rounded-lg"
                style={{ background: '#FFF5F5', border: '1px solid #FECACA' }}
              >
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm text-white transition-all duration-150"
              style={{
                background: loading
                  ? '#1E8E5A'
                  : 'linear-gradient(135deg, #2FBF71 0%, #1E8E5A 100%)',
                boxShadow: '0 2px 12px rgba(47,191,113,0.35)',
              }}
              disabled={loading}
            >
              {loading && (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-[11px] text-[#C0CAD4] mt-8">
            CorrePool CRM &mdash; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
