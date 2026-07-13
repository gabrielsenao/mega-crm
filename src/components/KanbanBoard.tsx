'use client'

import { useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Phone, Mail, MoreHorizontal, User } from 'lucide-react'
import { Lead, Column, COLUMNS } from '@/types'
import { moveLeadColumn } from '@/app/actions/leads'
import LeadModal from './LeadModal'

const COLUMN_COLORS: Record<Column, string> = {
  Base:         'bg-gray-100 text-gray-600',
  Agendamento:  'bg-blue-100 text-blue-700',
  Fechados:     'bg-green-100 text-green-700',
}

const COLUMN_DOTS: Record<Column, string> = {
  Base:         'bg-gray-400',
  Agendamento:  'bg-blue-500',
  Fechados:     'bg-green-500',
}

interface Props {
  initialLeads: Lead[]
}

export default function KanbanBoard({ initialLeads }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [modalLead, setModalLead] = useState<Lead | 'new' | null>(null)

  const leadsByColumn = useCallback((col: Column) =>
    leads
      .filter(l => l.coluna === col)
      .sort((a, b) => a.posicao - b.posicao),
    [leads]
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

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colLeads = leadsByColumn(col)
            return (
              <div key={col} className="flex-shrink-0 w-72 flex flex-col">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${COLUMN_DOTS[col]}`} />
                    <span className="text-sm font-semibold text-gray-700">{col}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COLUMN_COLORS[col]}`}>
                      {colLeads.length}
                    </span>
                  </div>
                  {col === 'Base' && (
                    <button
                      onClick={() => setModalLead('new')}
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {/* Droppable */}
                <Droppable droppableId={col}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-xl p-2 space-y-2 min-h-32 transition-colors scrollbar-thin overflow-y-auto ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-100/60'
                      }`}
                    >
                      {colLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setModalLead(lead)}
                              className={`bg-white rounded-xl p-3.5 cursor-pointer border transition-all ${
                                snapshot.isDragging
                                  ? 'shadow-lg border-blue-200 rotate-1'
                                  : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                              }`}
                            >
                              {/* Avatar + nome */}
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-semibold">
                                    {lead.nome.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{lead.nome}</p>
                                  {lead.numero && (
                                    <p className="text-xs text-gray-400 mt-0.5">{lead.numero}</p>
                                  )}
                                </div>
                                <MoreHorizontal size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
                              </div>

                              {/* Info */}
                              {lead.informacoes_adicionais && (
                                <p className="text-xs text-gray-500 mt-2.5 line-clamp-2 leading-relaxed">
                                  {lead.informacoes_adicionais}
                                </p>
                              )}

                              {/* Icons */}
                              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-50">
                                {lead.numero && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <Phone size={11} /> <span className="hidden sm:inline">Ligar</span>
                                  </span>
                                )}
                                {lead.email && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400">
                                    <Mail size={11} /> <span className="hidden sm:inline">Email</span>
                                  </span>
                                )}
                                <span className="ml-auto text-xs text-gray-300">
                                  {new Date(lead.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {colLeads.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <User size={24} className="mb-2 opacity-30" />
                          <p className="text-xs">Nenhum lead</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {modalLead && (
        <LeadModal
          lead={modalLead === 'new' ? undefined : modalLead}
          onClose={() => setModalLead(null)}
        />
      )}
    </>
  )
}
