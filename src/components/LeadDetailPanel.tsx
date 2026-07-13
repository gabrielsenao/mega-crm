'use client'

import { useState } from 'react'
import { X, Phone, Mail, MessageCircle, Calendar, Plus, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react'
import { Lead, COLUMNS, Column } from '@/types'
import { updateLead, deleteLead } from '@/app/actions/leads'

const AVATAR_COLORS = [
  'from-violet-500 to-purple-700',
  'from-blue-500 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-700',
]

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

type Tab = 'atividades' | 'contato' | 'negocio'

interface Props {
  lead: Lead
  origemAtiva: string
  onClose: () => void
}

export default function LeadDetailPanel({ lead, origemAtiva, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('atividades')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const stageIndex = COLUMNS.indexOf(lead.coluna as Column)
  const tags = lead.informacoes_adicionais
    ? lead.informacoes_adicionais.split(',').map(t => t.trim()).filter(Boolean)
    : []

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await updateLead(lead.id, fd)
    setLoading(false)
    setEditing(false)
    onClose()
  }

  async function handleDelete() {
    setLoading(true)
    await deleteLead(lead.id)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      {/* Painel */}
      <div
        className="relative bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Breadcrumb */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="font-medium text-gray-600">AprendaVFX Academy</span>
            <ChevronRight size={12} />
            <span>{origemAtiva}</span>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">{lead.nome}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Header do lead */}
        <div className="px-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor(lead.nome)} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-lg font-bold">
                {lead.nome.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Sem empresa</p>
              <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">{lead.nome}</h1>

              {/* Ações rápidas */}
              <div className="flex items-center gap-1 mb-3">
                {lead.numero && (
                  <a
                    href={`tel:${lead.numero}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"
                    title="Ligar"
                    onClick={e => e.stopPropagation()}
                  >
                    <Phone size={15} />
                  </a>
                )}
                {!lead.numero && (
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-300 transition-colors" disabled>
                    <Phone size={15} />
                  </button>
                )}
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors">
                  <MessageCircle size={15} />
                </button>
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"
                    title="E-mail"
                    onClick={e => e.stopPropagation()}
                  >
                    <Mail size={15} />
                  </a>
                )}
                {!lead.email && (
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-300 transition-colors" disabled>
                    <Mail size={15} />
                  </button>
                )}
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors">
                  <Calendar size={15} />
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.length > 0 ? tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-cyan-100 text-cyan-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {tag}
                    <button className="hover:text-cyan-900 transition-colors"><X size={10} /></button>
                  </span>
                )) : (
                  <span className="text-xs text-gray-400">Sem tags</span>
                )}
                <button className="w-6 h-6 flex items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
          {([
            { key: 'atividades', label: 'Atividades' },
            { key: 'contato', label: 'Contato' },
            { key: 'negocio', label: 'Negócio' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das tabs */}
        <div className="flex-1 overflow-y-auto">

          {/* Tab Atividades */}
          {tab === 'atividades' && (
            <div>
              {/* Pipeline de etapas */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-0">
                  <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center flex-1 justify-center gap-0">
                    {COLUMNS.map((col, idx) => {
                      const isActive = idx === stageIndex
                      const isPast = idx < stageIndex
                      return (
                        <div key={col} className="flex items-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                              isActive
                                ? 'bg-violet-600 border-violet-600 text-white'
                                : isPast
                                  ? 'bg-violet-200 border-violet-300 text-violet-700'
                                  : 'bg-white border-gray-200 text-gray-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <span className={`text-xs font-medium ${isActive ? 'text-violet-700' : isPast ? 'text-violet-500' : 'text-gray-400'}`}>
                              {col}
                            </span>
                          </div>
                          {idx < COLUMNS.length - 1 && (
                            <div className={`w-16 h-0.5 mb-5 mx-1 ${isPast ? 'bg-violet-300' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Atividades */}
              <div className="px-6 py-4">
                <div className="flex items-center gap-3 mb-4">
                  <button className="text-sm font-semibold text-violet-700 border-b-2 border-violet-600 pb-1">Próximas atividades</button>
                </div>

                <div className="text-center py-10 text-gray-400">
                  <Calendar size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma atividade agendada</p>
                  <button className="mt-3 text-xs text-violet-600 hover:text-violet-800 font-medium">+ Adicionar atividade</button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Contato */}
          {tab === 'contato' && (
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informações de contato</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone size={15} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{lead.numero || <span className="text-gray-400 italic">Sem telefone</span>}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={15} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{lead.email || <span className="text-gray-400 italic">Sem e-mail</span>}</span>
                  </div>
                </div>
              </div>
              {lead.informacoes_adicionais && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Observações</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2.5">{lead.informacoes_adicionais}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab Negócio */}
          {tab === 'negocio' && (
            <div className="px-6 py-5">
              {!editing ? (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Detalhes do negócio</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Etapa atual</p>
                      <span className="inline-block bg-violet-100 text-violet-700 text-sm font-medium px-3 py-1 rounded-full">{lead.coluna}</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Dono</p>
                      <p className="text-sm text-gray-700">{lead.dono || <span className="italic text-gray-400">Sem dono</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Criado em</p>
                      <p className="text-sm text-gray-700">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Última atualização</p>
                      <p className="text-sm text-gray-700">{new Date(lead.updated_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Origem</p>
                      <p className="text-sm text-gray-700">{origemAtiva}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Valor</p>
                      <p className="text-sm font-semibold text-gray-700">R$0</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-4 flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors"
                  >
                    <Edit2 size={13} /> Editar informações
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Editar lead</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nome <span className="text-red-500">*</span></label>
                    <input name="nome" required defaultValue={lead.nome} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
                    <input name="email" type="email" defaultValue={lead.email ?? ''} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                    <input name="numero" defaultValue={lead.numero ?? ''} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tags / Informações</label>
                    <input name="informacoes_adicionais" defaultValue={lead.informacoes_adicionais ?? ''} placeholder="Forms, Quente, VFX..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dono</label>
                    <input name="dono" defaultValue={lead.dono ?? ''} placeholder="Nome do closer responsável..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    {!confirmDelete ? (
                      <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 size={13} /> Excluir
                      </button>
                    ) : (
                      <button type="button" onClick={handleDelete} disabled={loading} className="text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors">
                        Confirmar exclusão
                      </button>
                    )}
                    <div className="flex-1" />
                    <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
