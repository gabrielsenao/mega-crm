'use client'

import { useState, useRef } from 'react'
import { Search, Download, Upload, Phone, Mail, ChevronRight, AlertTriangle } from 'lucide-react'
import { Contato, Lead } from '@/types'
import ContatoModal from './ContatoModal'
import DuplicadosModal from './DuplicadosModal'
import Navbar from './Navbar'

interface DupGroup { campo: string; contatos: Contato[] }

interface Props {
  contatos: Contato[]
  email: string
  duplicates: { byPhone: DupGroup[]; byEmail: DupGroup[] }
  leads?: Lead[]
}

const TAG_COLORS: Record<string, string> = {
  'InLead':    'bg-blue-100 text-blue-700',
  '3C Plus':   'bg-purple-100 text-purple-700',
  'SDR':       'bg-yellow-100 text-yellow-700',
  'Closer':    'bg-green-100 text-green-700',
  'Forms':     'bg-cyan-100 text-cyan-700',
}

const COLUNA_COLORS: Record<string, string> = {
  'Base':        'bg-gray-100 text-gray-600',
  'Agendamento': 'bg-blue-100 text-blue-700',
  'Fechados':    'bg-emerald-100 text-emerald-700',
  'Perdido':     'bg-red-100 text-red-600',
}

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'
}

function normalizePhone(p: string | null) {
  return (p ?? '').replace(/\D/g, '').slice(-9)
}

// Linha unificada: um contato + o lead vinculado (se houver)
interface Row {
  id: string
  nome: string
  email: string | null
  numero: string | null
  tags: string[]
  created_at: string
  negocio: { coluna: string; id: string } | null
  source: 'contato' | 'lead'
  contatoData?: Contato
}

export default function ContatosList({ contatos: initial, email, duplicates, leads = [] }: Props) {
  const [contatos] = useState<Contato[]>(initial)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [modal, setModal] = useState<Contato | 'new' | null>(null)
  const [showDuplicados, setShowDuplicados] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const totalDups = duplicates.byPhone.length + duplicates.byEmail.length

  // Mapa phone → lead e email → lead para lookup rápido
  const leadByPhone = new Map<string, Lead>()
  const leadByEmail = new Map<string, Lead>()
  for (const l of leads) {
    if (l.numero) leadByPhone.set(normalizePhone(l.numero), l)
    if (l.email) leadByEmail.set(l.email.toLowerCase().trim(), l)
  }

  // Constrói linhas: começa pelos contatos e vincula lead se houver
  const contatoIds = new Set<string>()
  const rows: Row[] = contatos.map(c => {
    const phoneKey = normalizePhone(c.numero)
    const emailKey = (c.email ?? '').toLowerCase().trim()
    const lead = leadByPhone.get(phoneKey) ?? leadByEmail.get(emailKey) ?? null
    if (lead) contatoIds.add(lead.id)
    return {
      id: c.id,
      nome: c.nome,
      email: c.email,
      numero: c.numero,
      tags: c.tags ?? [],
      created_at: c.created_at,
      negocio: lead ? { coluna: lead.coluna, id: lead.id } : null,
      source: 'contato',
      contatoData: c,
    }
  })

  // Leads que não têm contato correspondente também aparecem
  for (const l of leads) {
    if (!contatoIds.has(l.id)) {
      const tags = l.informacoes_adicionais
        ? l.informacoes_adicionais.split(',').map(t => t.trim()).filter(Boolean)
        : []
      rows.push({
        id: l.id,
        nome: l.nome,
        email: l.email,
        numero: l.numero,
        tags,
        created_at: l.created_at,
        negocio: { coluna: l.coluna, id: l.id },
        source: 'lead',
      })
    }
  }

  // Ordena por data de criação (mais recente primeiro)
  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const allTags = Array.from(new Set(rows.flatMap(r => r.tags)))

  const filtered = rows.filter(r => {
    const matchSearch = !search ||
      r.nome.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.numero?.includes(search)
    const matchTag = !filterTag || r.tags.includes(filterTag)
    return matchSearch && matchTag
  })

  function exportCSV() {
    const header = 'Nome,Email,Número,Tags,Negócio'
    const csvRows = rows.map(r =>
      [r.nome, r.email ?? '', r.numero ?? '', r.tags.join('|'), r.negocio?.coluna ?? '']
        .map(v => `"${v.replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [header, ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contatos-mega-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.trim().split('\n')
    const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
    const csvRows = lines.slice(1).map(line => {
      const cols = line.split(',').map(v => v.replace(/^"|"$/g, '').trim())
      return Object.fromEntries(header.map((h, i) => [h, cols[i] ?? '']))
    })

    const { importContatos } = await import('@/app/actions/contatos')
    await importContatos(csvRows as any)
    e.target.value = ''
    window.location.reload()
  }

  return (
    <>
      <div className="h-screen flex flex-col overflow-hidden">
        <Navbar
          email={email}
          onNewContact={() => setModal('new')}
        />

        <main className="flex-1 overflow-hidden flex flex-col px-6 py-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Listagem de contatos</p>
              <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
            </div>
            <div className="flex items-center gap-2">
              {totalDups > 0 && (
                <button
                  onClick={() => setShowDuplicados(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors font-medium"
                >
                  <AlertTriangle size={14} className="text-amber-500" />
                  Existe{totalDups > 1 ? 'm' : ''} {totalDups} grupo{totalDups > 1 ? 's' : ''} de duplicados
                </button>
              )}
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
              >
                <Download size={14} />
                Exportar CSV
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
              >
                <Upload size={14} />
                Importar CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar contato..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {allTags.length > 0 && (
              <select
                value={filterTag}
                onChange={e => setFilterTag(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
              >
                <option value="">Todas as listas</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <span className="text-sm text-gray-400 ml-auto">
              {filtered.length.toLocaleString('pt-BR')} contato{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-100 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-sm">Nenhum contato encontrado</p>
                <button
                  onClick={() => setModal('new')}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  Adicionar primeiro contato
                </button>
              </div>
            ) : (
              <table className="w-full">
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(r => (
                    <tr
                      key={r.id}
                      onClick={() => r.contatoData ? setModal(r.contatoData) : null}
                      className="flex items-center px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {/* Avatar */}
                      <td className="w-10 flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {r.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Nome */}
                      <td className="flex-1 min-w-0 px-4">
                        <p className="text-sm font-semibold text-gray-900 truncate">{r.nome}</p>
                      </td>

                      {/* Contato */}
                      <td className="w-48 flex-shrink-0 px-4">
                        <div className="space-y-0.5">
                          {r.numero && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone size={11} className="text-gray-400" />
                              {r.numero}
                            </div>
                          )}
                          {r.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Mail size={11} className="text-gray-400" />
                              <span className="truncate max-w-36">{r.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="w-48 flex-shrink-0 px-4">
                        <div className="flex flex-wrap gap-1">
                          {r.tags.length === 0 ? (
                            <span className="text-xs text-gray-300">Sem tags</span>
                          ) : r.tags.map(tag => (
                            <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColor(tag)}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Negócio */}
                      <td className="w-36 flex-shrink-0 px-4">
                        {r.negocio ? (
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${COLUNA_COLORS[r.negocio.coluna] ?? 'bg-gray-100 text-gray-600'}`}>
                            {r.negocio.coluna}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">Sem negócio</span>
                        )}
                      </td>

                      {/* Data */}
                      <td className="w-20 flex-shrink-0 text-xs text-gray-400 text-right px-2">
                        {new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>

                      <td className="w-8 flex-shrink-0 text-right">
                        <ChevronRight size={14} className="text-gray-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {modal && (
        <ContatoModal
          contato={modal === 'new' ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}

      {showDuplicados && (
        <DuplicadosModal
          byPhone={duplicates.byPhone}
          byEmail={duplicates.byEmail}
          onClose={() => setShowDuplicados(false)}
        />
      )}
    </>
  )
}
