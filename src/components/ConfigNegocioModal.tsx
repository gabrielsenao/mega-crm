'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Settings, GripVertical, Phone, MessageCircle, Mail, CheckSquare, ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { updateNegocio, getTarefasEtapa as getTarefasEtapaAction } from '@/app/actions/negocios'
import { createTarefaEtapa, deleteTarefaEtapa } from '@/app/actions/tarefas'
import { Negocio, TarefaEtapa, TipoTarefa } from '@/types'

interface Props {
  negocio: Negocio
  onClose: () => void
  onUpdated: (negocio: Negocio) => void
}

type Tab = 'geral' | 'etapas' | 'motivos'

const TIPOS: { value: TipoTarefa; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'ligacao',   label: 'Ligação',   icon: <Phone size={12} />,          color: 'text-blue-600 bg-blue-50' },
  { value: 'whatsapp',  label: 'WhatsApp',  icon: <MessageCircle size={12} />,  color: 'text-emerald-600 bg-emerald-50' },
  { value: 'email',     label: 'E-mail',    icon: <Mail size={12} />,           color: 'text-violet-600 bg-violet-50' },
  { value: 'tarefa',    label: 'Tarefa',    icon: <CheckSquare size={12} />,    color: 'text-gray-600 bg-gray-100' },
]

function tipoInfo(tipo: TipoTarefa) {
  return TIPOS.find(t => t.value === tipo) ?? TIPOS[3]
}

export default function ConfigNegocioModal({ negocio, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<Tab>('geral')
  const [nome, setNome] = useState(negocio.nome)
  const [etapas, setEtapas] = useState<string[]>(negocio.etapas)
  const [novaEtapa, setNovaEtapa] = useState('')
  const [motivos, setMotivos] = useState<string[]>((negocio as any).motivos_perda ?? [])
  const [novoMotivo, setNovoMotivo] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  // Tarefas
  const [tarefas, setTarefas] = useState<TarefaEtapa[]>([])
  const [etapaAberta, setEtapaAberta] = useState<string | null>(negocio.etapas[0] ?? null)
  const [loadingTarefas, setLoadingTarefas] = useState(false)
  const [novoForm, setNovoForm] = useState<{ etapa: string; tipo: TipoTarefa; titulo: string; descricao: string; dia: number; horario: string } | null>(null)
  const [savingTarefa, setSavingTarefa] = useState(false)

  useEffect(() => {
    if (tab !== 'etapas') return
    setLoadingTarefas(true)
    getTarefasEtapaAction(negocio.id)
      .then(setTarefas)
      .finally(() => setLoadingTarefas(false))
  }, [tab, negocio.id])

  // ── Etapas ──
  function addEtapa() {
    const t = novaEtapa.trim()
    if (!t || etapas.includes(t)) return
    setEtapas(prev => [...prev, t])
    setNovaEtapa('')
  }
  function removeEtapa(i: number) {
    if (etapas.length <= 1) return
    setEtapas(prev => prev.filter((_, idx) => idx !== i))
  }
  function renameEtapa(i: number, val: string) {
    setEtapas(prev => prev.map((e, idx) => idx === i ? val : e))
  }

  // ── Motivos ──
  function addMotivo() {
    const t = novoMotivo.trim()
    if (!t || motivos.includes(t)) return
    setMotivos(prev => [...prev, t])
    setNovoMotivo('')
  }
  function removeMotivo(i: number) {
    setMotivos(prev => prev.filter((_, idx) => idx !== i))
  }

  // ── Tarefas de etapa ──
  async function handleAddTarefa() {
    if (!novoForm || !novoForm.titulo.trim()) return
    setSavingTarefa(true)
    try {
      const ordemEtapa = tarefas.filter(t => t.etapa === novoForm.etapa).length
      const nova = await createTarefaEtapa({
        negocio_id: negocio.id,
        etapa: novoForm.etapa,
        tipo: novoForm.tipo,
        titulo: novoForm.titulo.trim(),
        descricao: novoForm.descricao.trim() || undefined,
        dia: novoForm.dia,
        horario: novoForm.horario || undefined,
        ordem: ordemEtapa,
      })
      setTarefas(prev => [...prev, nova as TarefaEtapa])
      setNovoForm(null)
    } finally {
      setSavingTarefa(false)
    }
  }

  async function handleDeleteTarefa(id: string) {
    setTarefas(prev => prev.filter(t => t.id !== id))
    await deleteTarefaEtapa(id)
  }

  // ── Salvar ──
  async function handleSave() {
    if (!nome.trim()) { setErro('Informe o nome do negócio'); return }
    if (etapas.some(e => !e.trim())) { setErro('Todas as etapas precisam ter nome'); return }
    setSaving(true)
    try {
      const etapasLimpas = etapas.map(e => e.trim()).filter(Boolean)
      await updateNegocio(negocio.id, { nome: nome.trim(), etapas: etapasLimpas, motivos_perda: motivos })
      onUpdated({ ...negocio, nome: nome.trim(), etapas: etapasLimpas, motivos_perda: motivos } as any)
      onClose()
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'geral',   label: 'Geral' },
    { key: 'etapas',  label: 'Etapas e atividades' },
    { key: 'motivos', label: 'Motivo de Perda' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-violet-500" />
            <h2 className="text-base font-bold text-gray-900">{negocio.nome}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-5 overflow-y-auto flex-1">

          {/* ── Geral ── */}
          {tab === 'geral' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Nome do negócio</label>
                <input
                  autoFocus
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {/* ── Etapas e atividades ── */}
          {tab === 'etapas' && (
            <div className="space-y-5">
              {/* Editar etapas */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Etapas do funil</p>
                <div className="space-y-1.5 mb-2">
                  {etapas.map((etapa, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <GripVertical size={13} className="text-gray-300 flex-shrink-0" />
                      <input
                        value={etapa}
                        onChange={e => renameEtapa(i, e.target.value)}
                        className="flex-1 text-sm text-gray-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-400 rounded px-1"
                      />
                      <button onClick={() => removeEtapa(i)} disabled={etapas.length <= 1} className="text-gray-300 hover:text-red-500 disabled:opacity-20">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={novaEtapa}
                    onChange={e => setNovaEtapa(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEtapa() } }}
                    placeholder="Nova etapa..."
                    className="flex-1 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-xl focus:outline-none focus:border-violet-400"
                  />
                  <button onClick={addEtapa} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl">
                    <Plus size={15} className="text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Cadência por etapa */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cadência de atividades</p>
                {loadingTarefas ? (
                  <p className="text-sm text-gray-400">Carregando...</p>
                ) : (
                  <div className="space-y-2">
                    {etapas.map(etapa => {
                      const tarefasEtapa = tarefas.filter(t => t.etapa === etapa)
                      const aberta = etapaAberta === etapa
                      return (
                        <div key={etapa} className="border border-gray-100 rounded-xl overflow-hidden">
                          {/* Header etapa */}
                          <button
                            onClick={() => setEtapaAberta(aberta ? null : etapa)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {aberta ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronRight size={13} className="text-gray-400" />}
                              <span className="text-sm font-semibold text-gray-800">{etapa}</span>
                              <span className="text-xs bg-white border border-gray-200 text-gray-500 rounded-full px-2 py-0.5">
                                {tarefasEtapa.length} atividade{tarefasEtapa.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); setEtapaAberta(etapa); setNovoForm({ etapa, tipo: 'ligacao', titulo: '', descricao: '', dia: tarefasEtapa.length + 1, horario: '09:00' }) }}
                              className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors"
                            >
                              <Plus size={11} /> Adicionar
                            </button>
                          </button>

                          {/* Lista de tarefas + form */}
                          {aberta && (
                            <div className="divide-y divide-gray-50">
                              {tarefasEtapa.map(t => {
                                const info = tipoInfo(t.tipo)
                                return (
                                  <div key={t.id} className="flex items-start gap-3 px-4 py-3">
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${info.color}`}>
                                      {info.icon}
                                      {info.label}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-800">{t.titulo}</p>
                                      {t.descricao && <p className="text-xs text-gray-500 mt-0.5">{t.descricao}</p>}
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-400">Dia {t.dia}</span>
                                        {t.horario && (
                                          <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                            <Clock size={10} /> {t.horario}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button onClick={() => handleDeleteTarefa(t.id)} className="text-gray-200 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                )
                              })}

                              {/* Form nova tarefa */}
                              {novoForm?.etapa === etapa && (
                                <div className="px-4 py-3 bg-violet-50/50 space-y-3">
                                  {/* Tipo */}
                                  <div className="flex gap-1.5 flex-wrap">
                                    {TIPOS.map(t => (
                                      <button
                                        key={t.value}
                                        onClick={() => setNovoForm(f => f ? { ...f, tipo: t.value } : f)}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                          novoForm.tipo === t.value ? t.color + ' ring-1 ring-current' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                      >
                                        {t.icon} {t.label}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Título */}
                                  <input
                                    autoFocus
                                    value={novoForm.titulo}
                                    onChange={e => setNovoForm(f => f ? { ...f, titulo: e.target.value } : f)}
                                    placeholder="Título da atividade..."
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                                  />

                                  {/* Descrição */}
                                  <textarea
                                    value={novoForm.descricao}
                                    onChange={e => setNovoForm(f => f ? { ...f, descricao: e.target.value } : f)}
                                    placeholder="Mensagem ou roteiro (opcional)..."
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none bg-white"
                                  />

                                  {/* Dia + Horário */}
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <label className="text-xs text-gray-400 block mb-1">Dia da cadência</label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={novoForm.dia}
                                        onChange={e => setNovoForm(f => f ? { ...f, dia: parseInt(e.target.value) || 1 } : f)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-xs text-gray-400 block mb-1">Horário</label>
                                      <input
                                        type="time"
                                        value={novoForm.horario}
                                        onChange={e => setNovoForm(f => f ? { ...f, horario: e.target.value } : f)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <button onClick={() => setNovoForm(null)} className="flex-1 py-2 text-sm text-gray-500 border border-gray-200 bg-white rounded-xl hover:bg-gray-50">
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={handleAddTarefa}
                                      disabled={savingTarefa || !novoForm.titulo.trim()}
                                      className="flex-1 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-medium rounded-xl transition-colors"
                                    >
                                      {savingTarefa ? 'Salvando...' : 'Salvar'}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {tarefasEtapa.length === 0 && novoForm?.etapa !== etapa && (
                                <div className="px-4 py-4 text-center">
                                  <p className="text-xs text-gray-400">Nenhuma atividade nesta etapa</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Motivo de Perda ── */}
          {tab === 'motivos' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Motivos de perda são usados quando um lead é marcado como perdido no funil.</p>
              <div className="space-y-2">
                {motivos.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-2">Nenhum motivo cadastrado ainda.</p>
                ) : motivos.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                    <span className="flex-1 text-sm text-gray-800">{m}</span>
                    <button onClick={() => removeMotivo(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={novoMotivo}
                  onChange={e => setNovoMotivo(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMotivo() } }}
                  placeholder="Ex: Sem interesse, Sem verba, Não qualificado..."
                  className="flex-1 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-xl focus:outline-none focus:border-violet-400"
                />
                <button onClick={addMotivo} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl">
                  <Plus size={15} className="text-gray-600" />
                </button>
              </div>
            </div>
          )}

          {erro && <p className="text-xs text-red-500 mt-3">{erro}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-sm bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium rounded-xl transition-colors">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
