'use client'

import { useState, useRef, useCallback } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useRouter } from 'next/navigation'
import type { Lead, StatusFunil, Temperatura } from '@/types'
import { Database, Download, Upload, AlertTriangle, FileJson, Table, Users } from 'lucide-react'

// ── CSV Template columns ───────────────────────────────────────────────────────
const CSV_COLUMNS = [
  'nome', 'telefone', 'email', 'observacao',
  'status_funil', 'temperatura',
  'valor_fechado', 'valor_contrato',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
  'data_criacao', 'data_reuniao', 'hora_reuniao',
]

function downloadCsvTemplate() {
  const header = CSV_COLUMNS.join(',')
  const example = [
    'João Silva', '11999990000', 'joao@email.com', 'Lead do Facebook',
    'primeiro_contato', 'morno',
    '', '15000',
    'facebook', 'cpc', 'campanha-maio', 'video-depoimento',
    '2024-01-15', '', '',
  ].join(',')
  const csv = `${header}\n${example}\n`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template-importacao-crm.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function parseCsv(text: string): Partial<Lead>[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = values[i] ?? '' })
    const lead: Partial<Lead> = {
      nome: obj.nome || undefined,
      telefone: obj.telefone || undefined,
      email: obj.email || undefined,
      observacao: obj.observacao || undefined,
      status_funil: (obj.status_funil as StatusFunil) || undefined,
      temperatura: (obj.temperatura as Temperatura) || undefined,
      valor_fechado: obj.valor_fechado ? Number(obj.valor_fechado) : undefined,
      valor_contrato: obj.valor_contrato ? Number(obj.valor_contrato) : undefined,
      utm_source: obj.utm_source || undefined,
      utm_medium: obj.utm_medium || undefined,
      utm_campaign: obj.utm_campaign || undefined,
      utm_content: obj.utm_content || undefined,
      data_criacao: obj.data_criacao || undefined,
      data_reuniao: obj.data_reuniao || undefined,
      hora_reuniao: obj.hora_reuniao || undefined,
    }
    return lead
  })
}

// ── Excel export helper (re-uses HTML-table trick) ────────────────────────────
function downloadExcel(leads: Lead[]) {
  const headers = ['Nome', 'Telefone', 'Email', 'Status', 'Temperatura', 'Valor Fechado', 'Criado em']
  const rows = leads.map((l) => [
    l.nome, l.telefone, l.email, l.status_funil, l.temperatura,
    l.valor_fechado ?? '', l.data_criacao,
  ])
  const table = [
    '<table>',
    '<tr>' + headers.map((h) => `<th>${h}</th>`).join('') + '</tr>',
    ...rows.map((r) => '<tr>' + r.map((c) => `<td>${c ?? ''}</td>`).join('') + '</tr>'),
    '</table>',
  ].join('')
  const blob = new Blob([`<html><body>${table}</body></html>`], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup-leads-${new Date().toISOString().split('T')[0]}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Page ─────────────────────────────────────────────────────────────────────
type Tab = 'backup' | 'restaurar' | 'importar'

export default function DadosPage() {
  const { currentUser, leads, users, downloadBackup, restoreFromBackup, importFromCRM } = useApp()
  const router = useRouter()

  // Redirect non-admins
  if (currentUser && currentUser.tipo !== 'admin') {
    router.replace('/dashboard')
    return null
  }

  const [tab, setTab] = useState<Tab>('backup')

  // ── Backup state ──────────────────────────────────────────────────────────
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupError, setBackupError] = useState('')

  async function handleDownloadJSON() {
    setBackupLoading(true)
    setBackupError('')
    try {
      await downloadBackup()
    } catch (e) {
      setBackupError((e as Error).message)
    } finally {
      setBackupLoading(false)
    }
  }

  function handleDownloadExcel() {
    downloadExcel(leads)
  }

  // ── Restore state ─────────────────────────────────────────────────────────
  const restoreInputRef = useRef<HTMLInputElement>(null)
  const [restoreLeads, setRestoreLeads] = useState<Lead[] | null>(null)
  const [restoreConfirm, setRestoreConfirm] = useState('')
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreError, setRestoreError] = useState('')
  const [restoreSuccess, setRestoreSuccess] = useState(false)

  function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as Lead[]
        setRestoreLeads(Array.isArray(parsed) ? parsed : null)
        setRestoreError(Array.isArray(parsed) ? '' : 'Arquivo inválido: esperado um array de leads')
      } catch {
        setRestoreError('Arquivo JSON inválido')
        setRestoreLeads(null)
      }
    }
    reader.readAsText(file)
  }

  async function handleRestore() {
    if (!restoreLeads || restoreConfirm !== 'CONFIRMAR') return
    setRestoreLoading(true)
    setRestoreError('')
    try {
      await restoreFromBackup(restoreLeads)
      setRestoreSuccess(true)
      setRestoreLeads(null)
      setRestoreConfirm('')
    } catch (e) {
      setRestoreError((e as Error).message)
    } finally {
      setRestoreLoading(false)
    }
  }

  // ── Import CRM state ──────────────────────────────────────────────────────
  const importInputRef = useRef<HTMLInputElement>(null)
  const [importLeads, setImportLeads] = useState<Partial<Lead>[]>([])
  const [importVendedor, setImportVendedor] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)

  const vendedores = users.filter((u) => u.tipo === 'vendedor' && u.ativo !== false)

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = parseCsv(ev.target?.result as string)
        setImportLeads(parsed)
        setImportError('')
      } catch {
        setImportError('Erro ao processar CSV')
        setImportLeads([])
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!importLeads.length || !importVendedor) return
    setImportLoading(true)
    setImportError('')
    try {
      await importFromCRM(importLeads, importVendedor)
      setImportSuccess(true)
      setImportLeads([])
      setImportVendedor('')
      if (importInputRef.current) importInputRef.current.value = ''
    } catch (e) {
      setImportError((e as Error).message)
    } finally {
      setImportLoading(false)
    }
  }

  const tabStyle = (t: Tab) => ({
    padding: '8px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: tab === t ? 'linear-gradient(135deg,#2FBF71,#1E8E5A)' : 'transparent',
    color: tab === t ? '#fff' : '#6B7C93',
    transition: 'all 0.15s',
  } as React.CSSProperties)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#2FBF71,#1E8E5A)' }}>
          <Database size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1F2D3D]">Gestão de Dados</h1>
          <p className="text-sm text-[#6B7C93]">Backup, restauração e importação de CRM</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F5F7FA', border: '1px solid #E0E6ED' }}>
        <button style={tabStyle('backup')} onClick={() => setTab('backup')}>Backup</button>
        <button style={tabStyle('restaurar')} onClick={() => setTab('restaurar')}>Restaurar</button>
        <button style={tabStyle('importar')} onClick={() => setTab('importar')}>Importar CRM</button>
      </div>

      {/* ── Backup Tab ─────────────────────────────────────────────────────── */}
      {tab === 'backup' && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#fff', border: '1px solid #E0E6ED' }}>
          <h2 className="font-bold text-[#1F2D3D] text-base">Download de Backup</h2>
          <p className="text-sm text-[#6B7C93]">
            Baixe todos os leads cadastrados para guardar localmente.
            Atualmente há <strong>{leads.length}</strong> leads no banco.
          </p>
          {backupError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{backupError}</p>
          )}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleDownloadJSON}
              disabled={backupLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#2FBF71,#1E8E5A)' }}
            >
              <FileJson size={16} />
              {backupLoading ? 'Baixando...' : 'Download JSON'}
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#F5F7FA', border: '1px solid #E0E6ED', color: '#1F2D3D' }}
            >
              <Table size={16} />
              Download Excel
            </button>
          </div>
        </div>
      )}

      {/* ── Restore Tab ────────────────────────────────────────────────────── */}
      {tab === 'restaurar' && (
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#fff', border: '1px solid #E0E6ED' }}>
          <h2 className="font-bold text-[#1F2D3D] text-base">Restaurar Backup</h2>

          {/* Warning box */}
          <div className="rounded-xl p-4 flex gap-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Atenção: operação irreversível</p>
              <p className="text-sm text-red-600 mt-0.5">
                Todos os leads, anotações, histórico e alertas atuais serão <strong>apagados permanentemente</strong>.
                Apenas os dados do arquivo de backup serão mantidos.
              </p>
            </div>
          </div>

          {restoreSuccess && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 font-semibold">
              Banco restaurado com sucesso!
            </p>
          )}
          {restoreError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{restoreError}</p>
          )}

          {/* File upload */}
          <div>
            <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">
              Selecionar arquivo de backup (.json)
            </label>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="block w-full text-sm text-[#6B7C93] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#F5F7FA] file:text-[#1F2D3D] file:cursor-pointer"
            />
          </div>

          {/* Preview */}
          {restoreLeads && (
            <div className="rounded-xl p-4 space-y-2" style={{ background: '#F5F7FA', border: '1px solid #E0E6ED' }}>
              <p className="text-sm font-semibold text-[#1F2D3D]">
                {restoreLeads.length} leads encontrados no arquivo
              </p>
              <div className="space-y-1">
                {restoreLeads.slice(0, 5).map((l, i) => (
                  <p key={i} className="text-xs text-[#6B7C93]">
                    {i + 1}. {l.nome} — {l.status_funil}
                  </p>
                ))}
                {restoreLeads.length > 5 && (
                  <p className="text-xs text-[#A0AEC0]">...e mais {restoreLeads.length - 5}</p>
                )}
              </div>
            </div>
          )}

          {/* Confirmation */}
          {restoreLeads && (
            <div>
              <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">
                Digite <code className="bg-red-100 text-red-700 px-1 rounded">CONFIRMAR</code> para continuar
              </label>
              <input
                type="text"
                value={restoreConfirm}
                onChange={(e) => setRestoreConfirm(e.target.value)}
                placeholder="CONFIRMAR"
                className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none"
                style={{ borderColor: '#E0E6ED', background: '#fff' }}
              />
            </div>
          )}

          <button
            onClick={handleRestore}
            disabled={!restoreLeads || restoreConfirm !== 'CONFIRMAR' || restoreLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#DC2626' }}
          >
            <Upload size={16} />
            {restoreLoading ? 'Restaurando...' : 'Restaurar Banco'}
          </button>
        </div>
      )}

      {/* ── Import CRM Tab ─────────────────────────────────────────────────── */}
      {tab === 'importar' && (
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#fff', border: '1px solid #E0E6ED' }}>
          <h2 className="font-bold text-[#1F2D3D] text-base">Importar Leads de CRM Externo</h2>

          <div className="rounded-xl p-4 flex gap-3" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <Download size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              <strong>Regra de dashboard:</strong> fechamentos e reuniões de leads importados
              contam nas métricas. Total de leads, taxas e criativos <strong>não</strong> são afetados.
            </p>
          </div>

          {importSuccess && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 font-semibold">
              Leads importados com sucesso!
            </p>
          )}
          {importError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{importError}</p>
          )}

          {/* Template download */}
          <div>
            <p className="text-sm text-[#6B7C93] mb-2">
              Baixe o template CSV com as colunas esperadas, preencha e faça o upload.
            </p>
            <button
              onClick={downloadCsvTemplate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: '#F5F7FA', border: '1px solid #E0E6ED', color: '#1F2D3D' }}
            >
              <Download size={15} />
              Baixar Template CSV
            </button>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">
              Upload do arquivo CSV
            </label>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportFile}
              className="block w-full text-sm text-[#6B7C93] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#F5F7FA] file:text-[#1F2D3D] file:cursor-pointer"
            />
          </div>

          {/* Vendedor selector */}
          <div>
            <label className="block text-sm font-semibold text-[#1F2D3D] mb-2">
              <Users size={14} className="inline mr-1" />
              Atribuir leads ao vendedor
            </label>
            <select
              value={importVendedor}
              onChange={(e) => setImportVendedor(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none"
              style={{ borderColor: '#E0E6ED', background: '#fff', color: '#1F2D3D' }}
            >
              <option value="">Selecionar vendedor...</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>
          </div>

          {/* Preview table */}
          {importLeads.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E0E6ED' }}>
              <div className="px-4 py-2 text-xs font-bold text-[#6B7C93] uppercase tracking-wide"
                style={{ background: '#F5F7FA', borderBottom: '1px solid #E0E6ED' }}>
                Preview — {importLeads.length} leads ({Math.min(10, importLeads.length)} exibidos)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E0E6ED' }}>
                      {['Nome', 'Status', 'Temperatura', 'Valor Fechado'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-[#6B7C93]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importLeads.slice(0, 10).map((l, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F5F7FA' }}>
                        <td className="px-3 py-2 text-[#1F2D3D] font-medium">{l.nome || '-'}</td>
                        <td className="px-3 py-2 text-[#6B7C93]">{l.status_funil || '-'}</td>
                        <td className="px-3 py-2 text-[#6B7C93]">{l.temperatura || '-'}</td>
                        <td className="px-3 py-2 text-[#6B7C93]">
                          {l.valor_fechado ? `R$ ${l.valor_fechado.toLocaleString('pt-BR')}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!importLeads.length || !importVendedor || importLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#2FBF71,#1E8E5A)' }}
          >
            <Upload size={16} />
            {importLoading ? 'Importando...' : `Importar ${importLeads.length} leads`}
          </button>
        </div>
      )}
    </div>
  )
}
