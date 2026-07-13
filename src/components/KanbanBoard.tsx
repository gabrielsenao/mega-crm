'use client'

import { useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Phone, Mail, MoreHorizontal, MessageCircle, UserPlus, Search, SlidersHorizontal } from 'lucide-react'
import { Lead, Column, COLUMNS } from '@/types'
import { moveLeadColumn } from '@/app/actions/leads'
import LeadModal from './LeadModal'
import LeadDetailPanel from './LeadDetailPanel'

function diasDesde(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return '1d'
  return `${d}d`
}

interface Props {
  initialLeads: Lead[]
  onNewLead: () => void
  origemAtiva?: string
}

export default function KanbanBoard({ initialLeads, onNewLead, origemAtiva = 'InLead' }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [detailLead, setDetailLead] = useState<Lead | null>(null)
  const [search, setSearch] = useState('')

  const filtered = leads.filter(l =>
    !search || l.nome.toLowerCase().includes(search.toLowerCase())
  )

  const leadsByColumn = useCallback((col: Column) =>
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

  const total = filtered.length

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Filtros */}
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {['Data', 'Campos', 'Tags', 'Status'].map(f => (
            <button key={f} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              {f}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          ))}
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <SlidersHorizontal size={13} />
            Mais filtros
          </button>
        </div>

        {/* Contador separado */}
        <p className="text-sm text-gray-600 mb-3 flex-shrink-0">
          {total.toLocaleString('pt-BR')} oportunidade{total !== 1 ? 's' : ''} de negócio
        </p>

        {/* Kanban */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 flex-1 overflow-x-auto pb-2">
            {COLUMNS.map(col => {
              const colLeads = leadsByColumn(col)
              return (
                <div key={col} className="flex-shrink-0 w-64 flex flex-col">
                  {/* Cabeçalho da coluna */}
                  <div className="flex items-center justify-between mb-1 px-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{col}</span>
                      <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 font-medium min-w-[20px] text-center">
                        {colLeads.length >= 1000 ? `${(colLeads.length / 1000).toFixed(1)}k` : colLeads.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={onNewLead}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 transition-colors"
                      >
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
                                onClick={() => setDetailLead(lead)}
                                className={`bg-white rounded-lg p-3 cursor-pointer border transition-all ${
                                  snapshot.isDragging
                                    ? 'shadow-lg border-blue-200 rotate-1'
                                    : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                }`}
                              >
                                {/* Tag */}
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded font-medium">
                                    {lead.informacoes_adicionais?.split(' ')[0] ?? 'Lead'}
                                  </span>
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

                                {/* Ações + contador */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <button className="text-gray-400 hover:text-gray-600" onClick={e => e.stopPropagation()} title="Atribuir">
                                      <UserPlus size={13} />
                                    </button>
                                    <button className="text-gray-400 hover:text-gray-600" onClick={e => e.stopPropagation()} title="Ligar">
                                      <Phone size={13} />
                                    </button>
                                    <button className="text-gray-400 hover:text-gray-600" onClick={e => e.stopPropagation()} title="E-mail">
                                      <Mail size={13} />
                                    </button>
                                    <button className="text-gray-400 hover:text-gray-600" onClick={e => e.stopPropagation()} title="Mensagem">
                                      <MessageCircle size={13} />
                                    </button>
                                    <span className="text-xs text-gray-400 font-medium">R$0</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                                    {diasDesde(lead.created_at)}
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
          origemAtiva={origemAtiva}
          onClose={() => setDetailLead(null)}
        />
      )}
    </>
  )
}
