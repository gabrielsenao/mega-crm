'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Settings } from 'lucide-react'
import { updateNegocio } from '@/app/actions/negocios'
import { Negocio } from '@/types'

interface Props {
  negocio: Negocio
  onClose: () => void
  onUpdated: (negocio: Negocio) => void
}

type Tab = 'geral' | 'motivos'

export default function ConfigNegocioModal({ negocio, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<Tab>('geral')
  const [nome, setNome] = useState(negocio.nome)
  const [motivos, setMotivos] = useState<string[]>(
    (negocio as any).motivos_perda ?? []
  )
  const [novoMotivo, setNovoMotivo] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  function addMotivo() {
    const t = novoMotivo.trim()
    if (!t || motivos.includes(t)) return
    setMotivos(prev => [...prev, t])
    setNovoMotivo('')
  }

  function removeMotivo(i: number) {
    setMotivos(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (!nome.trim()) { setErro('Informe o nome do negócio'); return }
    setSaving(true)
    try {
      await updateNegocio(negocio.id, {
        nome: nome.trim(),
        motivos_perda: motivos,
      })
      onUpdated({ ...negocio, nome: nome.trim(), motivos_perda: motivos } as any)
      onClose()
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-violet-500" />
            <h2 className="text-base font-bold text-gray-900">{negocio.nome}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {([
            { key: 'geral',   label: 'Geral' },
            { key: 'motivos', label: 'Motivo de Perda' },
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

        {/* Conteúdo */}
        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>

          {/* ── Geral ── */}
          {tab === 'geral' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  Nome do negócio
                </label>
                <input
                  autoFocus
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {/* ── Motivo de Perda ── */}
          {tab === 'motivos' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Motivos de perda são usados quando um lead é marcado como perdido no funil.
              </p>

              {/* Lista */}
              <div className="space-y-2">
                {motivos.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-2">Nenhum motivo cadastrado ainda.</p>
                ) : (
                  motivos.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                      <span className="flex-1 text-sm text-gray-800">{m}</span>
                      <button
                        onClick={() => removeMotivo(i)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Adicionar */}
              <div className="flex gap-2">
                <input
                  value={novoMotivo}
                  onChange={e => setNovoMotivo(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMotivo() } }}
                  placeholder="Ex: Sem interesse, Sem verba, Não qualificado..."
                  className="flex-1 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                />
                <button
                  onClick={addMotivo}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          )}

          {erro && <p className="text-xs text-red-500 mt-3">{erro}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium rounded-xl transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
