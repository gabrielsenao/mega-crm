'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Phone, MoreHorizontal, MessageCircle, Search, UserMinus, ChevronDown, Trophy, ThumbsDown, X, Check, SlidersHorizontal } from 'lucide-react'
import { Lead, Column, COLUMNS, Negocio } from '@/types'
import { moveLeadColumn, updateLeadDono, updateLeadStatus } from '@/app/actions/leads'
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

interface Props {
  initialLeads: Lead[]
  onNewLead: () => void
  negocioAtivo?: Negocio | null
  etapas?: string[]
}

export default function KanbanBoard({ initialLeads, onNewLead, negocioAtivo = null, etapas = COLUMNS }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [detailLead, setDetailLead] = useState<Lead | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [perdaOpen, setPerdaOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
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
    setPerdaOpen(false)
  }

  async function handleGanho() {
    setSalvando(true)
    const ids = [...selected]
    await updateLeadStatus(ids, 'ganho')
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: 'ganho' } : l))
    clearSelection()
    setSalvando(false)
  }

  async function handlePerda(motivo: string) {
    setSalvando(true)
    const ids = [...selected]
    await updateLeadStatus(ids, 'perdido', motivo)
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: 'perdido', motivo_perda: motivo } : l))
    clearSelection()
    setSalvando(false)
  }

  const hasDateFilter = !!(dateFilter || dateFrom || dateTo)

  const filtered = leads.filter(l => {
    const matchNegocio = negocioAtivo ? l.negocio_id === negocioAtivo.id : true
    const matchStatus = (l.status ?? 'ativo') === 'ativo'
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
    return matchNegocio && matchStatus && matchSearch && matchDate
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

          {['Campos', 'Tags', 'Status'].map(f => (
            <button key={f} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              {f} <ChevronDown size={11} />
            </button>
          ))}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          {/* Picker de motivo de perda */}
          {perdaOpen && (
            <div className="mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-72">
              <p className="text-xs font-semibold text-gray-500 mb-2">Motivo de perda</p>
              <div className="space-y-1">
                {(negocioAtivo?.motivos_perda?.length
                  ? negocioAtivo.motivos_perda
                  : ['Sem dinheiro', 'Sem tempo', 'Sem computador', 'Não atendeu as ligações', 'Outro']
                ).map(motivo => (
                  <button
                    key={motivo}
                    onClick={() => handlePerda(motivo)}
                    disabled={salvando}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    {motivo}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 bg-gray-900 text-white rounded-2xl px-4 py-3 shadow-2xl">
            <button onClick={clearSelection} className="text-gray-400 hover:text-white transition-colors mr-1">
              <X size={15} />
            </button>
            <span className="text-sm font-semibold mr-2">
              {selected.size} selecionado{selected.size > 1 ? 's' : ''}
            </span>
            <div className="w-px h-4 bg-gray-700" />
            <button
              onClick={handleGanho}
              disabled={salvando}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Trophy size={13} />
              Ganho
            </button>
            <button
              onClick={() => setPerdaOpen(p => !p)}
              disabled={salvando}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                perdaOpen ? 'bg-red-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <ThumbsDown size={13} />
              Perda
            </button>
          </div>
        </div>
      )}
    </>
  )
}
