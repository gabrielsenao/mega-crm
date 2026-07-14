'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Phone, MoreHorizontal, MessageCircle, Search, UserMinus, ChevronDown, Trophy, ThumbsDown, X, Check, SlidersHorizontal } from 'lucide-react'
import { Lead, Column, COLUMNS } from '@/types'
import { moveLeadColumn, updateLeadDono, updateLeadStatus, updateLeadsColuna, updateLeadsDono, updateLeadsNegocio, deleteLeads } from '@/app/actions/leads'
import { Negocio as NegocioType, Origem } from '@/types'
import LeadModal from './LeadModal'
import LeadDetailPanel from './LeadDetailPanel'

// ── Helpers ──────────────────────────────────────────────────────────────────

function tempoDesde(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return '1d'
  return `${d}d`
}

const DONO_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
]
function donoColor(nome: string) {
  return DONO_COLORS[nome.charCodeAt(0) % DONO_COLORS.length]
}

function dateRangeFilter(date: string, preset: string): boolean {
  if (!preset) return true
  const d = new Date(date)
  const now = new Date()
  const startOf = (unit: 'day' | 'week' | 'month' | 'year') => {
    const s = new Date(now)
    if (unit === 'day') s.setHours(0, 0, 0, 0)
    if (unit === 'week') { s.setDate(s.getDate() - s.getDay()); s.setHours(0, 0, 0, 0) }
    if (unit === 'month') { s.setDate(1); s.setHours(0, 0, 0, 0) }
    if (unit === 'year') { s.setMonth(0, 1); s.setHours(0, 0, 0, 0) }
    return s
  }
  switch (preset) {
    case 'hoje':        return d >= startOf('day')
    case 'ontem': {     const s = startOf('day'); s.setDate(s.getDate() - 1); const e = startOf('day'); return d >= s && d < e }
    case 'semana':      return d >= startOf('week')
    case 'semana_ant': { const e = startOf('week'); const s = new Date(e); s.setDate(s.getDate() - 7); return d >= s && d < e }
    case 'mes':         return d >= startOf('month')
    case 'mes_ant': {   const e = startOf('month'); const s = new Date(e); s.setMonth(s.getMonth() - 1); return d >= s && d < e }
    case 'ano':         return d >= startOf('year')
    default: return true
  }
}

const DATE_PRESETS = [
  { label: 'Hoje',           value: 'hoje' },
  { label: 'Ontem',          value: 'ontem' },
  { label: 'Essa semana',    value: 'semana' },
  { label: 'Semana passada', value: 'semana_ant' },
  { label: 'Esse mês',       value: 'mes' },
  { label: 'Mês passado',    value: 'mes_ant' },
  { label: 'Esse ano',       value: 'ano' },
]

// ── Componente de dono no card ────────────────────────────────────────────────

function DonoButton({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(lead.dono ?? '')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function save() {
    setSaving(true)
    await updateLeadDono(lead.id, value || null)
    setSaving(false)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        title={lead.dono ?? 'Sem dono'}
        className="flex items-center justify-center"
      >
        {lead.dono ? (
          <div className={`w-5 h-5 rounded-full ${donoColor(lead.dono)} flex items-center justify-center`}>
            <span className="text-white text-[9px] font-bold leading-none">
              {lead.dono.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <UserMinus size={13} className="text-gray-300" />
        )}
      </button>

      {open && (
        <div className="absolute bottom-7 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-44">
          <p className="text-xs font-semibold text-gray-500 mb-2">Atribuir dono</p>
          <input
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save() }}
            placeholder="Nome do closer..."
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 mb-2"
          />
          <div className="flex gap-1.5">
            {value && (
              <button
                onClick={() => { setValue(''); updateLeadDono(lead.id, null); setOpen(false) }}
                className="flex-1 py-1 text-xs text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg transition-colors"
              >
                Remover
              </button>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-1 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
            >
              {saving ? '...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── KanbanBoard ───────────────────────────────────────────────────────────────

type ActivePanel = 'etapa' | 'dono' | 'status' | 'origem' | 'tag' | null

interface Props {
  initialLeads: Lead[]
  onNewLead: () => void
  negocioAtivo?: NegocioType | null
  etapas?: string[]
  negocios?: NegocioType[]
  origens?: Origem[]
}

export default function KanbanBoard({ initialLeads, onNewLead, negocioAtivo = null, etapas = COLUMNS, negocios = [], origens = [] }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [detailLead, setDetailLead] = useState<Lead | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [salvando, setSalvando] = useState(false)
  const [donoFilter, setDonoFilter] = useState('')
  const [origemFilter, setOrigemFilter] = useState('')
  const [etapaFilter, setEtapaFilter] = useState('')

  // Filtros de kanban
  const [openFilter, setOpenFilter] = useState<'status' | 'dono' | 'tags' | null>(null)
  const [filterStatusSet, setFilterStatusSet] = useState<Set<string>>(new Set(['ativo']))
  const [filterDonoSet, setFilterDonoSet] = useState<Set<string>>(new Set())
  const [filterTagSet, setFilterTagSet] = useState<Set<string>>(new Set())
  const [filterDonoSearch, setFilterDonoSearch] = useState('')
  const [filterTagSearch, setFilterTagSearch] = useState('')
  const filterRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dateOpen, setDateOpen] = useState(false)
  const dateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false)
    }
    if (dateOpen) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [dateOpen])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setOpenFilter(null)
    }
    if (openFilter) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [openFilter])

  function clearDateFilter() {
    setDateFilter('')
    setDateFrom('')
    setDateTo('')
  }

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelected(new Set())
    setActivePanel(null)
    setDonoFilter('')
    setOrigemFilter('')
    setEtapaFilter('')
  }

  function togglePanel(p: ActivePanel) {
    setActivePanel(prev => prev === p ? null : p)
    setDonoFilter('')
    setOrigemFilter('')
    setEtapaFilter('')
  }

  async function handleEtapa(etapa: string) {
    setSalvando(true)
    const ids = [...selected]
    await updateLeadsColuna(ids, etapa)
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, coluna: etapa } : l))
    clearSelection()
    setSalvando(false)
  }

  async function handleDono(dono: string | null) {
    setSalvando(true)
    const ids = [...selected]
    await updateLeadsDono(ids, dono)
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, dono } : l))
    clearSelection()
    setSalvando(false)
  }

  async function handleStatus(status: string, motivo?: string) {
    setSalvando(true)
    const ids = [...selected]
    await updateLeadStatus(ids, status, motivo)
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: status as Lead['status'], motivo_perda: motivo ?? null } : l))
    clearSelection()
    setSalvando(false)
  }

  async function handleOrigem(negocioId: string) {
    setSalvando(true)
    const ids = [...selected]
    await updateLeadsNegocio(ids, negocioId)
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, negocio_id: negocioId } : l))
    clearSelection()
    setSalvando(false)
  }

  async function handleDelete() {
    if (!confirm(`Excluir ${selected.size} lead(s)? Essa ação não pode ser desfeita.`)) return
    setSalvando(true)
    const ids = [...selected]
    await deleteLeads(ids)
    setLeads(prev => prev.filter(l => !ids.includes(l.id)))
    clearSelection()
    setSalvando(false)
  }

  // Dados derivados para os pickers
  const donosUnicos = [...new Set(leads.filter(l => l.dono).map(l => l.dono as string))].sort()
  const tagsUnicas = [...new Set(
    leads.flatMap(l => l.informacoes_adicionais?.split(',').map(t => t.trim()).filter(Boolean) ?? [])
  )].sort()

  const hasDateFilter = !!(dateFilter || dateFrom || dateTo)
  const hasStatusFilter = filterStatusSet.size > 0 && !(filterStatusSet.size === 1 && filterStatusSet.has('ativo'))
  const hasDonoFilter = filterDonoSet.size > 0
  const hasTagFilter = filterTagSet.size > 0

  const filtered = leads.filter(l => {
    const matchNegocio = negocioAtivo ? l.negocio_id === negocioAtivo.id : true

    const currentStatus = l.status ?? 'ativo'
    const matchStatus = filterStatusSet.size === 0 || filterStatusSet.has(currentStatus)

    const matchDono = filterDonoSet.size === 0 ||
      (filterDonoSet.has('__sem_dono__') && !l.dono) ||
      (!!l.dono && filterDonoSet.has(l.dono))

    const leadTags = l.informacoes_adicionais?.split(',').map(t => t.trim()).filter(Boolean) ?? []
    const matchTag = filterTagSet.size === 0 || leadTags.some(t => filterTagSet.has(t))

    const q = search.toLowerCase()
    const matchSearch = !q ||
      l.nome.toLowerCase().includes(q) ||
      (l.email ?? '').toLowerCase().includes(q) ||
      (l.numero ?? '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      (l.dono ?? '').toLowerCase().includes(q)

    let matchDate = true
    if (dateFilter) {
      matchDate = dateRangeFilter(l.created_at, dateFilter)
    } else if (dateFrom || dateTo) {
      const d = new Date(l.created_at)
      if (dateFrom) matchDate = matchDate && d >= new Date(dateFrom + 'T00:00:00')
      if (dateTo)   matchDate = matchDate && d <= new Date(dateTo   + 'T23:59:59')
    }
    return matchNegocio && matchStatus && matchDono && matchTag && matchSearch && matchDate
  })

  const leadsByColumn = useCallback((col: string) =>
    filtered.filter(l => l.coluna === col).sort((a, b) => a.posicao - b.posicao),
    [filtered]
  )

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return
    const destCol = destination.droppableId as Column
    setLeads(prev => prev.map(l =>
      l.id === draggableId ? { ...l, coluna: destCol, posicao: destination.index } : l
    ))
    await moveLeadColumn(draggableId, destCol, destination.index)
  }

  const dateLabel = dateFilter
    ? DATE_PRESETS.find(p => p.value === dateFilter)?.label ?? 'Data'
    : (dateFrom || dateTo)
      ? `${dateFrom ? new Date(dateFrom + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '...'} → ${dateTo ? new Date(dateTo + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '...'}`
      : 'Data'

  const total = filtered.length

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Filtros */}
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          {/* Busca */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nome, telefone ou e-mail..."
              className="pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Data */}
          <div ref={dateRef} className="relative">
            <button
              onClick={() => setDateOpen(!dateOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                hasDateFilter
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {dateLabel}
              <ChevronDown size={11} />
            </button>
            {dateOpen && (
              <div className="absolute top-9 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-xl py-2 w-64">
                {/* Limpar */}
                <div className="px-3 pb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Data de inscrição</p>
                  {hasDateFilter && (
                    <button onClick={() => { clearDateFilter() }} className="text-xs text-blue-500 hover:text-blue-700">
                      Limpar
                    </button>
                  )}
                </div>

                {/* Intervalo personalizado */}
                <div className="px-3 pb-3 space-y-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">De</p>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => { setDateFrom(e.target.value); setDateFilter('') }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Até</p>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => { setDateTo(e.target.value); setDateFilter('') }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="h-px bg-gray-100 mx-3 mb-1" />

                {/* Atalhos */}
                <div className="px-1">
                  <button
                    onClick={() => { clearDateFilter(); setDateOpen(false) }}
                    className={`w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 transition-colors ${!hasDateFilter ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                  >
                    Qualquer data
                  </button>
                  {DATE_PRESETS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => { setDateFilter(p.value); setDateFrom(''); setDateTo(''); setDateOpen(false) }}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 transition-colors ${dateFilter === p.value ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filtros com dropdown */}
          <div ref={filterRef} className="flex items-center gap-2">

            {/* Status */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  hasStatusFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Status {hasStatusFilter && `· ${filterStatusSet.size}`} <ChevronDown size={11} />
              </button>
              {openFilter === 'status' && (
                <div className="absolute top-9 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-xl py-2 w-48">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-3 pb-1">Status do lead</p>
                  {[
                    { value: 'ativo', label: 'Aberto' },
                    { value: 'ganho', label: 'Ganho' },
                    { value: 'perdido', label: 'Perdido' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setFilterStatusSet(prev => {
                          const next = new Set(prev)
                          next.has(value) ? next.delete(value) : next.add(value)
                          return next
                        })
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        filterStatusSet.has(value) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}>
                        {filterStatusSet.has(value) && <Check size={10} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className={value === 'ganho' ? 'text-emerald-600' : value === 'perdido' ? 'text-red-500' : ''}>{label}</span>
                    </button>
                  ))}
                  {filterStatusSet.size > 0 && (
                    <div className="border-t border-gray-100 mt-1 pt-1 px-3">
                      <button onClick={() => setFilterStatusSet(new Set(['ativo']))} className="text-xs text-blue-500 hover:text-blue-700">
                        Resetar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dono */}
            <div className="relative">
              <button
                onClick={() => { setOpenFilter(openFilter === 'dono' ? null : 'dono'); setFilterDonoSearch('') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  hasDonoFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Dono {hasDonoFilter && `· ${filterDonoSet.size}`} <ChevronDown size={11} />
              </button>
              {openFilter === 'dono' && (
                <div className="absolute top-9 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-xl py-2 w-56">
                  <div className="px-2 pb-2">
                    <div className="relative">
                      <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input autoFocus value={filterDonoSearch} onChange={e => setFilterDonoSearch(e.target.value)}
                        placeholder="Buscar por..." className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {[{ value: '__sem_dono__', label: 'Sem dono' }, ...donosUnicos.filter(d => d.toLowerCase().includes(filterDonoSearch.toLowerCase())).map(d => ({ value: d, label: d }))].map(({ value, label }) => (
                      <button key={value}
                        onClick={() => setFilterDonoSet(prev => { const next = new Set(prev); next.has(value) ? next.delete(value) : next.add(value); return next })}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${filterDonoSet.has(value) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                          {filterDonoSet.has(value) && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                        {value !== '__sem_dono__' && (
                          <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                            {label[0].toUpperCase()}
                          </div>
                        )}
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                  {hasDonoFilter && (
                    <div className="border-t border-gray-100 mt-1 pt-1 px-3">
                      <button onClick={() => setFilterDonoSet(new Set())} className="text-xs text-blue-500 hover:text-blue-700">Limpar</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="relative">
              <button
                onClick={() => { setOpenFilter(openFilter === 'tags' ? null : 'tags'); setFilterTagSearch('') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  hasTagFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Tags {hasTagFilter && `· ${filterTagSet.size}`} <ChevronDown size={11} />
              </button>
              {openFilter === 'tags' && (
                <div className="absolute top-9 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-xl py-2 w-56">
                  <div className="px-2 pb-2">
                    <div className="relative">
                      <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input autoFocus value={filterTagSearch} onChange={e => setFilterTagSearch(e.target.value)}
                        placeholder="Buscar por..." className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {tagsUnicas.filter(t => t.toLowerCase().includes(filterTagSearch.toLowerCase())).map(tag => (
                      <button key={tag}
                        onClick={() => setFilterTagSet(prev => { const next = new Set(prev); next.has(tag) ? next.delete(tag) : next.add(tag); return next })}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${filterTagSet.has(tag) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                          {filterTagSet.has(tag) && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded font-medium truncate">{tag}</span>
                      </button>
                    ))}
                    {tagsUnicas.length === 0 && <p className="text-xs text-gray-400 px-3 py-2">Sem tags cadastradas</p>}
                  </div>
                  {hasTagFilter && (
                    <div className="border-t border-gray-100 mt-1 pt-1 px-3">
                      <button onClick={() => setFilterTagSet(new Set())} className="text-xs text-blue-500 hover:text-blue-700">Limpar</button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <SlidersHorizontal size={13} /> Mais filtros
          </button>
        </div>

        {/* Contador */}
        <p className="text-sm text-gray-600 mb-3 flex-shrink-0">
          {total.toLocaleString('pt-BR')} oportunidade{total !== 1 ? 's' : ''} de negócio
        </p>

        {/* Kanban */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 flex-1 overflow-x-auto pb-2">
            {etapas.map(col => {
              const colLeads = leadsByColumn(col)
              return (
                <div key={col} className="flex-shrink-0 w-64 flex flex-col">
                  {/* Cabeçalho */}
                  <div className="flex items-center justify-between mb-1 px-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{col}</span>
                      <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 font-medium min-w-[20px] text-center">
                        {colLeads.length >= 1000 ? `${(colLeads.length / 1000).toFixed(1)}k` : colLeads.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={onNewLead} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 transition-colors">
                        <Plus size={14} />
                      </button>
                      <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2 px-0.5">R$0</p>

                  {/* Coluna */}
                  <Droppable droppableId={col}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 rounded-xl p-1.5 space-y-2 min-h-24 overflow-y-auto scrollbar-thin transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-50/80' : 'bg-gray-100/70'
                        }`}
                      >
                        {colLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => !selected.size && setDetailLead(lead)}
                                className={`group bg-white rounded-lg p-3 cursor-pointer border transition-all ${
                                  snapshot.isDragging
                                    ? 'shadow-lg border-blue-200 rotate-1'
                                    : selected.has(lead.id)
                                    ? 'border-violet-400 ring-1 ring-violet-300'
                                    : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                }`}
                              >
                                {/* Tag + checkbox */}
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded font-medium">
                                    {lead.informacoes_adicionais?.split(',')[0]?.trim() ?? 'Lead'}
                                  </span>
                                  <button
                                    onClick={e => toggleSelect(lead.id, e)}
                                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                      selected.has(lead.id)
                                        ? 'bg-violet-600 border-violet-600'
                                        : 'border-gray-300 hover:border-violet-400 bg-white opacity-0 group-hover:opacity-100'
                                    }`}
                                  >
                                    {selected.has(lead.id) && <Check size={10} className="text-white" strokeWidth={3} />}
                                  </button>
                                </div>

                                {/* Nome + avatar */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">
                                    {lead.nome}
                                  </p>
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">
                                      {lead.nome.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>

                                {/* Ações + dono + tempo */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <DonoButton lead={lead} />
                                    <button className="text-gray-400 hover:text-gray-600" onClick={e => e.stopPropagation()}>
                                      <Phone size={13} />
                                    </button>
<button className="text-gray-400 hover:text-gray-600" onClick={e => e.stopPropagation()}>
                                      <MessageCircle size={13} />
                                    </button>
                                    <span className="text-xs text-gray-400 font-medium">R$0</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                    {tempoDesde(lead.updated_at)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        <button
                          onClick={onNewLead}
                          className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus size={12} /> Adicionar negócio
                        </button>
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      {detailLead && (
        <LeadDetailPanel
          lead={detailLead}
          origemAtiva={negocioAtivo?.nome ?? 'Geral'}
          etapas={etapas}
          onClose={() => setDetailLead(null)}
        />
      )}

      {/* Barra de seleção */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
          {/* Painel ativo */}
          {activePanel && (
            <div className="mb-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden w-72">
              {activePanel === 'etapa' && (
                <>
                  <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-700">Alterar etapa</p>
                    <button onClick={() => setActivePanel(null)}><X size={13} className="text-gray-400" /></button>
                  </div>
                  <div className="px-2 pt-2 pb-1">
                    <input autoFocus value={etapaFilter} onChange={e => setEtapaFilter(e.target.value)} placeholder="Digite para filtrar..." className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 mb-1" />
                  </div>
                  <div className="max-h-48 overflow-y-auto pb-2">
                    {etapas.filter(e => e.toLowerCase().includes(etapaFilter.toLowerCase())).map(etapa => (
                      <button key={etapa} onClick={() => handleEtapa(etapa)} disabled={salvando}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">{etapa}</button>
                    ))}
                  </div>
                </>
              )}
              {activePanel === 'dono' && (
                <>
                  <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-700">Alterar dono</p>
                    <button onClick={() => setActivePanel(null)}><X size={13} className="text-gray-400" /></button>
                  </div>
                  <div className="px-2 pt-2 pb-1">
                    <input autoFocus value={donoFilter} onChange={e => setDonoFilter(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && donoFilter.trim()) handleDono(donoFilter.trim()) }}
                      placeholder="Digite para filtrar..." className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 mb-1" />
                  </div>
                  <div className="max-h-48 overflow-y-auto pb-2">
                    {donosUnicos.filter(d => d.toLowerCase().includes(donoFilter.toLowerCase())).map(dono => (
                      <button key={dono} onClick={() => handleDono(dono)} disabled={salvando}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold">{dono[0].toUpperCase()}</div>
                        {dono}
                      </button>
                    ))}
                    {donoFilter.trim() && !donosUnicos.includes(donoFilter.trim()) && (
                      <button onClick={() => handleDono(donoFilter.trim())} disabled={salvando}
                        className="w-full text-left px-4 py-2 text-sm text-violet-600 hover:bg-violet-50 transition-colors">
                        Atribuir "{donoFilter.trim()}"
                      </button>
                    )}
                  </div>
                </>
              )}
              {activePanel === 'status' && (
                <>
                  <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-700">Alterar status</p>
                    <button onClick={() => setActivePanel(null)}><X size={13} className="text-gray-400" /></button>
                  </div>
                  <div className="py-2">
                    <button onClick={() => handleStatus('ativo')} disabled={salvando}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">Aberto</button>
                    <button onClick={() => handleStatus('ganho')} disabled={salvando}
                      className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2">
                      <Trophy size={13} /> Ganho
                    </button>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <p className="text-[10px] text-gray-400 px-4 py-1 font-semibold uppercase tracking-wide">Perdido — motivo</p>
                      {(negocioAtivo?.motivos_perda?.length
                        ? negocioAtivo.motivos_perda
                        : ['Sem dinheiro', 'Sem tempo', 'Sem computador', 'Não atendeu as ligações', 'Outro']
                      ).map(motivo => (
                        <button key={motivo} onClick={() => handleStatus('perdido', motivo)} disabled={salvando}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          {motivo}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {activePanel === 'origem' && (
                <>
                  <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-700">Alterar origem</p>
                    <button onClick={() => setActivePanel(null)}><X size={13} className="text-gray-400" /></button>
                  </div>
                  <div className="px-2 pt-2 pb-1">
                    <input autoFocus value={origemFilter} onChange={e => setOrigemFilter(e.target.value)} placeholder="Digite para filtrar..." className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 mb-1" />
                  </div>
                  <div className="max-h-48 overflow-y-auto pb-2">
                    {origens.map(org => {
                      const negsOrig = negocios.filter(n => n.origem_id === org.id && n.nome.toLowerCase().includes(origemFilter.toLowerCase()))
                      if (!negsOrig.length) return null
                      return (
                        <div key={org.id}>
                          <p className="text-[10px] text-gray-400 px-4 py-1 font-semibold uppercase tracking-wide">{org.nome}</p>
                          {negsOrig.map(neg => (
                            <button key={neg.id} onClick={() => handleOrigem(neg.id)} disabled={salvando}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">{neg.nome}</button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
              {activePanel === 'tag' && (
                <>
                  <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-700">Alterar tag</p>
                    <button onClick={() => setActivePanel(null)}><X size={13} className="text-gray-400" /></button>
                  </div>
                  <div className="py-2">
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <span className="text-base">🏷️</span> Incluir
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <span className="text-base">🗑️</span> Remover
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 bg-violet-700 text-white rounded-2xl px-3 py-2.5 shadow-2xl">
            <button onClick={clearSelection} className="text-violet-300 hover:text-white transition-colors p-1 mr-1">
              <X size={14} />
            </button>
            <div className="flex items-center gap-1 bg-white/20 rounded-lg px-2 py-1">
              <span className="text-xs font-bold">{selected.size}</span>
              <span className="text-xs text-violet-200">selecionado{selected.size > 1 ? 's' : ''}</span>
            </div>
            {selected.size < filtered.length ? (
              <button
                onClick={() => setSelected(new Set(filtered.map(l => l.id)))}
                className="text-xs text-violet-300 hover:text-white underline underline-offset-2 px-1 mr-1 transition-colors"
              >
                Selecionar todos ({filtered.length.toLocaleString('pt-BR')})
              </button>
            ) : (
              <span className="text-xs text-violet-300 px-1 mr-1">Todos selecionados</span>
            )}
            {(['etapa', 'dono', 'status', 'origem', 'tag'] as ActivePanel[]).map(p => (
              <button key={p} onClick={() => togglePanel(p)} disabled={salvando}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  activePanel === p ? 'bg-white text-violet-700' : 'hover:bg-white/20 text-white'
                }`}>
                {p === 'etapa' ? 'Etapa' : p === 'dono' ? 'Dono' : p === 'status' ? 'Status' : p === 'origem' ? 'Origem' : 'Tag'}
              </button>
            ))}
            <div className="w-px h-4 bg-white/30 mx-1" />
            <button onClick={handleDelete} disabled={salvando}
              className="p-1.5 rounded-lg hover:bg-red-500 text-violet-200 hover:text-white transition-colors">
              <ThumbsDown size={14} className="hidden" />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
