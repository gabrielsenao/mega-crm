'use client'

import { useState, useEffect } from 'react'
import { X, Phone, Mail, MessageCircle, Calendar, Plus, ChevronLeft, ChevronRight, Edit2, Trash2, Check, StickyNote, CheckSquare, Square, Clock } from 'lucide-react'
import { Lead, Nota, TarefaLead, TipoTarefa } from '@/types'
import { updateLead, deleteLead, addNota, deleteNota } from '@/app/actions/leads'
import { getTarefasLead, concluirTarefa, deleteTarefaLead, createTarefaManual } from '@/app/actions/tarefas'

const TIPO_CONFIG: Record<TipoTarefa, { label: string; color: string }> = {
  ligacao:  { label: 'Ligação',  color: 'text-blue-600 bg-blue-50' },
  whatsapp: { label: 'WhatsApp', color: 'text-emerald-600 bg-emerald-50' },
  email:    { label: 'E-mail',   color: 'text-violet-600 bg-violet-50' },
  tarefa:   { label: 'Tarefa',   color: 'text-gray-600 bg-gray-100' },
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-700',
  'from-blue-500 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-700',
]
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ── Inline field ──────────────────────────────────────────────────────────────

function InlineField({
  label, value, name, placeholder, type = 'text', onSave,
}: {
  label: string
  value: string | null
  name: string
  placeholder?: string
  type?: string
  onSave: (name: string, value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function save() {
    onSave(name, val)
    setEditing(false)
  }

  function cancel() {
    setVal(value ?? '')
    setEditing(false)
  }

  return (
    <div className="group">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type={type}
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
            placeholder={placeholder}
            className="flex-1 px-2.5 py-1.5 text-sm border border-violet-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button onClick={save} className="w-7 h-7 flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">
            <Check size={13} />
          </button>
          <button onClick={cancel} className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors">
            <X size={13} />
          </button>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-1.5 -mx-2.5 hover:bg-gray-50 transition-colors"
          onClick={() => setEditing(true)}
        >
          <p className={`text-sm flex-1 ${val ? 'text-gray-800' : 'text-gray-400 italic'}`}>
            {val || placeholder || 'Não informado'}
          </p>
          <Edit2 size={12} className="text-gray-300 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
        </div>
      )}
    </div>
  )
}

// ── Painel principal ──────────────────────────────────────────────────────────

type Tab = 'atividades' | 'contato' | 'negocio'

interface Props {
  lead: Lead
  origemAtiva: string
  etapas?: string[]
  onClose: () => void
}

export default function LeadDetailPanel({ lead, origemAtiva, etapas = ['Base', 'Agendamento', 'Fechados'], onClose }: Props) {
  const [tab, setTab] = useState<Tab>('atividades')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Anotações
  const [notas, setNotas] = useState<Nota[]>(lead.notas ?? [])
  const [novaNota, setNovaNota] = useState('')
  const [savingNota, setSavingNota] = useState(false)

  // Tarefas
  const [tarefas, setTarefas] = useState<TarefaLead[]>([])
  const [loadingTarefas, setLoadingTarefas] = useState(false)
  const [novoTarefaForm, setNovoTarefaForm] = useState(false)
  const [novoTipoTarefa, setNovoTipoTarefa] = useState<TipoTarefa>('tarefa')
  const [novoTituloTarefa, setNovoTituloTarefa] = useState('')
  const [savingTarefa, setSavingTarefa] = useState(false)

  useEffect(() => {
    setLoadingTarefas(true)
    getTarefasLead(lead.id).then(setTarefas).finally(() => setLoadingTarefas(false))
  }, [lead.id])

  async function handleToggleTarefa(id: string, atual: boolean) {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, concluida: !atual } : t))
    await concluirTarefa(id, !atual)
  }

  async function handleDeleteTarefa(id: string) {
    setTarefas(prev => prev.filter(t => t.id !== id))
    await deleteTarefaLead(id)
  }

  async function handleAddTarefa() {
    if (!novoTituloTarefa.trim()) return
    setSavingTarefa(true)
    await createTarefaManual(lead.id, { tipo: novoTipoTarefa, titulo: novoTituloTarefa.trim() })
    const atualizadas = await getTarefasLead(lead.id)
    setTarefas(atualizadas)
    setNovoTituloTarefa('')
    setNovoTarefaForm(false)
    setSavingTarefa(false)
  }

  const stageIndex = etapas.indexOf(lead.coluna)
  const tags = lead.informacoes_adicionais
    ? lead.informacoes_adicionais.split(',').map(t => t.trim()).filter(Boolean)
    : []

  // Inline field save
  async function handleFieldSave(name: string, value: string) {
    const fd = new FormData()
    fd.set('nome', lead.nome)
    fd.set('email', lead.email ?? '')
    fd.set('numero', lead.numero ?? '')
    fd.set('informacoes_adicionais', lead.informacoes_adicionais ?? '')
    fd.set('dono', lead.dono ?? '')
    fd.set(name, value)
    await updateLead(lead.id, fd)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteLead(lead.id)
    setDeleting(false)
    onClose()
  }

  async function handleAddNota() {
    const texto = novaNota.trim()
    if (!texto) return
    setSavingNota(true)
    const nova: Nota = { id: crypto.randomUUID(), texto, created_at: new Date().toISOString() }
    setNotas(prev => [...prev, nova])
    setNovaNota('')
    await addNota(lead.id, texto)
    setSavingNota(false)
  }

  async function handleDeleteNota(id: string) {
    setNotas(prev => prev.filter(n => n.id !== id))
    await deleteNota(lead.id, id)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      <div
        className="relative bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl"
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
          <div className="flex items-center gap-1">
            <button onClick={() => setTab('negocio')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <Edit2 size={14} />
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor(lead.nome)} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-lg font-bold">{lead.nome.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Sem empresa</p>
              <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">{lead.nome}</h1>
              <div className="flex items-center gap-1 mb-3">
                {lead.numero
                  ? <a href={`tel:${lead.numero}`} onClick={e => e.stopPropagation()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"><Phone size={15} /></a>
                  : <button disabled className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-200"><Phone size={15} /></button>
                }
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"><MessageCircle size={15} /></button>
                {lead.email
                  ? <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"><Mail size={15} /></a>
                  : <button disabled className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-200"><Mail size={15} /></button>
                }
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"><Calendar size={15} /></button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.length > 0 ? tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-cyan-100 text-cyan-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                )) : <span className="text-xs text-gray-400">Sem tags</span>}
                <button className="w-6 h-6 flex items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 transition-colors">
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
            { key: 'contato',    label: 'Contato' },
            { key: 'negocio',    label: 'Negócio' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Atividades ── */}
          {tab === 'atividades' && (
            <div>
              {/* Pipeline */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center">
                  <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0"><ChevronLeft size={16} /></button>
                  <div className="flex items-center flex-1 justify-center overflow-x-auto">
                    {etapas.map((col, idx) => {
                      const isActive = idx === stageIndex
                      const isPast = idx < stageIndex
                      return (
                        <div key={col} className="flex items-center flex-shrink-0">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                              isActive ? 'bg-violet-600 border-violet-600 text-white'
                              : isPast  ? 'bg-violet-200 border-violet-300 text-violet-700'
                              : 'bg-white border-gray-200 text-gray-400'
                            }`}>{idx + 1}</div>
                            <span className={`text-[10px] font-medium max-w-[56px] text-center leading-tight ${isActive ? 'text-violet-700' : isPast ? 'text-violet-500' : 'text-gray-400'}`}>{col}</span>
                          </div>
                          {idx < etapas.length - 1 && <div className={`w-10 h-0.5 mb-5 mx-1 flex-shrink-0 ${isPast ? 'bg-violet-300' : 'bg-gray-200'}`} />}
                        </div>
                      )
                    })}
                  </div>
                  <button className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0"><ChevronRight size={16} /></button>
                </div>
              </div>

              {/* Tarefas */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={14} className="text-violet-500" />
                    <p className="text-sm font-semibold text-gray-800">Tarefas</p>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                      {tarefas.filter(t => !t.concluida).length} pendente{tarefas.filter(t => !t.concluida).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => setNovoTarefaForm(true)}
                    className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium"
                  >
                    <Plus size={12} /> Adicionar
                  </button>
                </div>

                {loadingTarefas ? (
                  <p className="text-xs text-gray-400 py-2">Carregando...</p>
                ) : (
                  <div className="space-y-1.5">
                    {tarefas.length === 0 && !novoTarefaForm && (
                      <p className="text-xs text-gray-400 italic py-2">Nenhuma tarefa. As tarefas aparecem automaticamente quando o lead muda de etapa.</p>
                    )}
                    {tarefas.map(t => {
                      const cfg = TIPO_CONFIG[t.tipo] ?? TIPO_CONFIG.tarefa
                      return (
                        <div key={t.id} className={`group flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition-colors ${t.concluida ? 'opacity-50' : 'hover:bg-gray-50'}`}>
                          <button
                            onClick={() => handleToggleTarefa(t.id, t.concluida)}
                            className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-violet-500 transition-colors"
                          >
                            {t.concluida ? <CheckSquare size={15} className="text-violet-400" /> : <Square size={15} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.color}`}>{cfg.label}</span>
                              <p className={`text-sm font-medium ${t.concluida ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.titulo}</p>
                            </div>
                            {t.descricao && <p className="text-xs text-gray-400">{t.descricao}</p>}
                            {t.data_prevista && (
                              <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                <Clock size={10} />
                                {new Date(t.data_prevista).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteTarefa(t.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-200 hover:text-red-400 transition-all flex-shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )
                    })}

                    {novoTarefaForm && (
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2 mt-1">
                        <div className="flex gap-1.5 flex-wrap">
                          {(Object.entries(TIPO_CONFIG) as [TipoTarefa, typeof TIPO_CONFIG['tarefa']][]).map(([tipo, cfg]) => (
                            <button
                              key={tipo}
                              onClick={() => setNovoTipoTarefa(tipo)}
                              className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${novoTipoTarefa === tipo ? cfg.color + ' ring-1 ring-current' : 'bg-white border border-gray-200 text-gray-500'}`}
                            >
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                        <input
                          autoFocus
                          value={novoTituloTarefa}
                          onChange={e => setNovoTituloTarefa(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddTarefa(); if (e.key === 'Escape') setNovoTarefaForm(false) }}
                          placeholder="Título da tarefa..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setNovoTarefaForm(false)} className="flex-1 py-1.5 text-xs text-gray-500 border border-gray-200 bg-white rounded-lg">Cancelar</button>
                          <button onClick={handleAddTarefa} disabled={savingTarefa || !novoTituloTarefa.trim()} className="flex-1 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-medium rounded-lg">
                            {savingTarefa ? '...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Anotações */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-4">
                  <StickyNote size={14} className="text-violet-500" />
                  <p className="text-sm font-semibold text-gray-800">Anotações</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{notas.length}</span>
                </div>

                {/* Input nova anotação */}
                <div className="flex gap-2 mb-5">
                  <textarea
                    value={novaNota}
                    onChange={e => setNovaNota(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNota() } }}
                    placeholder="Adicionar anotação... (Enter para salvar)"
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                  <button
                    onClick={handleAddNota}
                    disabled={!novaNota.trim() || savingNota}
                    className="px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-lg transition-colors self-end"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Lista de anotações */}
                {notas.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <StickyNote size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma anotação ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...notas].reverse().map(nota => (
                      <div key={nota.id} className="group bg-gray-50 rounded-xl px-4 py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{nota.texto}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(nota.created_at)}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteNota(nota.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all flex-shrink-0 mt-0.5"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Contato ── */}
          {tab === 'contato' && (
            <div className="px-6 py-5 space-y-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Informações de contato</p>
              <div className="space-y-4">
                <InlineField label="Nome" value={lead.nome} name="nome" placeholder="Nome completo" onSave={handleFieldSave} />
                <InlineField label="E-mail" value={lead.email} name="email" type="email" placeholder="email@exemplo.com" onSave={handleFieldSave} />
                <InlineField label="Telefone" value={lead.numero} name="numero" placeholder="+55 11 99999-0000" onSave={handleFieldSave} />
                <InlineField label="Tags / Informações" value={lead.informacoes_adicionais} name="informacoes_adicionais" placeholder="Forms, Quente, InLead..." onSave={handleFieldSave} />
              </div>
            </div>
          )}

          {/* ── Negócio ── */}
          {tab === 'negocio' && (
            <div className="px-6 py-5 space-y-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Detalhes do negócio</p>
              <div className="space-y-4">
                <InlineField label="Dono / Responsável" value={lead.dono} name="dono" placeholder="Nome do closer..." onSave={handleFieldSave} />
                <div>
                  <p className="text-xs text-gray-400 mb-1">Etapa atual</p>
                  <span className="inline-block bg-violet-100 text-violet-700 text-sm font-medium px-3 py-1 rounded-full">{lead.coluna}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Valor</p>
                  <p className="text-sm text-gray-500 italic">R$0</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Origem</p>
                  <p className="text-sm text-gray-700">{origemAtiva}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Criado em</p>
                    <p className="text-sm text-gray-700">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Última atualização</p>
                    <p className="text-sm text-gray-700">{new Date(lead.updated_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              {/* Excluir */}
              <div className="pt-4 border-t border-gray-100">
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 size={13} /> Excluir lead
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-600">Confirmar exclusão?</p>
                    <button onClick={handleDelete} disabled={deleting} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                      {deleting ? 'Excluindo...' : 'Confirmar'}
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
