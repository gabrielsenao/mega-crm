'use client'

import { useState } from 'react'
import { X, Plus, Trash2, GripVertical } from 'lucide-react'
import { createNegocio } from '@/app/actions/negocios'
import { Origem, Negocio } from '@/types'

interface Props {
  origemId: string
  origemNome: string
  onClose: () => void
  onCreated: (negocio: Negocio) => void
}

const ETAPAS_PADRAO = ['Base', 'Agendamento', 'Fechados']

export default function NovoNegocioModal({ origemId, origemNome, onClose, onCreated }: Props) {
  const [nome, setNome] = useState('')
  const [etapas, setEtapas] = useState<string[]>(ETAPAS_PADRAO)
  const [novaEtapa, setNovaEtapa] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setErro('Informe o nome do negócio'); return }
    if (etapas.length === 0) { setErro('Adicione pelo menos uma etapa'); return }
    setSaving(true)
    try {
      const neg = await createNegocio(nome.trim(), origemId, etapas)
      onCreated(neg as Negocio)
      onClose()
    } catch {
      setErro('Erro ao criar negócio. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{origemNome}</p>
            <h2 className="text-lg font-bold text-gray-900">Novo negócio</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
              Nome do negócio
            </label>
            <input
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Formulário, Lançamento, Webinário..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Etapas */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
              Etapas do funil
            </label>
            <div className="space-y-1.5 mb-2">
              {etapas.map((etapa, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <GripVertical size={12} className="text-gray-300 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-700">{etapa}</span>
                  <button
                    type="button"
                    onClick={() => removeEtapa(i)}
                    disabled={etapas.length <= 1}
                    className="text-gray-300 hover:text-red-400 disabled:opacity-20 transition-colors"
                  >
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
                className="flex-1 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
              />
              <button
                type="button"
                onClick={addEtapa}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {erro && <p className="text-xs text-red-500">{erro}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium rounded-xl transition-colors"
            >
              {saving ? 'Criando...' : 'Criar negócio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
