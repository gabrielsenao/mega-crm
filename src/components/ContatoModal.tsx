'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Contato } from '@/types'
import { createContato, updateContato, deleteContato } from '@/app/actions/contatos'

interface Props {
  contato?: Contato
  onClose: () => void
}

export default function ContatoModal({ contato, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isEditing = !!contato

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    if (isEditing) {
      await updateContato(contato.id, fd)
    } else {
      await createContato(fd)
    }
    setLoading(false)
    onClose()
  }

  async function handleDelete() {
    if (!contato) return
    setLoading(true)
    await deleteContato(contato.id)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEditing ? 'Editar contato' : 'Novo contato'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              name="nome"
              required
              defaultValue={contato?.nome}
              placeholder="Nome completo"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={contato?.email ?? ''}
              placeholder="email@exemplo.com"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input
              name="numero"
              defaultValue={contato?.numero ?? ''}
              placeholder="(11) 99999-0000"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
              <span className="text-gray-400 font-normal ml-1">(separadas por vírgula)</span>
            </label>
            <input
              name="tags"
              defaultValue={contato?.tags?.join(', ') ?? ''}
              placeholder="InLead, 3C Plus, SDR..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Informações adicionais</label>
            <textarea
              name="informacoes_adicionais"
              defaultValue={contato?.informacoes_adicionais ?? ''}
              placeholder="Observações..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {isEditing && !confirmDelete && (
              <button type="button" onClick={() => setConfirmDelete(true)}
                className="text-sm text-red-500 hover:text-red-700 transition-colors">
                Excluir
              </button>
            )}
            {confirmDelete && (
              <button type="button" onClick={handleDelete} disabled={loading}
                className="text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors">
                Confirmar exclusão
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
