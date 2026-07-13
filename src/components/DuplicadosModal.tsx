'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp, GitMerge, Phone, Mail, CheckCircle2 } from 'lucide-react'
import { Contato } from '@/types'
import { mergeContatos } from '@/app/actions/contatos'

interface DupGroup {
  campo: string
  contatos: Contato[]
}

interface Props {
  byPhone: DupGroup[]
  byEmail: DupGroup[]
  onClose: () => void
}

type Tab = 'phone' | 'email'

export default function DuplicadosModal({ byPhone, byEmail, onClose }: Props) {
  const [tab, setTab] = useState<Tab>(byPhone.length > 0 ? 'phone' : 'email')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [merging, setMerging] = useState<string | null>(null)
  const [merged, setMerged] = useState<Set<string>>(new Set())
  const [winnerId, setWinnerId] = useState<Record<string, string>>({})

  const groups = tab === 'phone' ? byPhone : byEmail
  const totalPhone = byPhone.reduce((a, g) => a + g.contatos.length - 1, 0)
  const totalEmail = byEmail.reduce((a, g) => a + g.contatos.length - 1, 0)

  async function handleMerge(group: DupGroup) {
    const key = group.campo
    const winner = winnerId[key] ?? group.contatos[0].id
    const deleteIds = group.contatos.map(c => c.id).filter(id => id !== winner)

    setMerging(key)
    await mergeContatos(winner, deleteIds)
    setMerging(null)
    setMerged(prev => new Set([...prev, key]))
  }

  function toggleExpand(key: string) {
    setExpanded(prev => prev === key ? null : key)
  }

  function selectWinner(groupKey: string, id: string) {
    setWinnerId(prev => ({ ...prev, [groupKey]: id }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Contatos duplicados</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
          <button
            onClick={() => setTab('phone')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'phone' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Phone size={13} />
            Telefone
            {totalPhone > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">{totalPhone}</span>
            )}
          </button>
          <button
            onClick={() => setTab('email')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'email' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail size={13} />
            E-mail
            {totalEmail > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">{totalEmail}</span>
            )}
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {groups.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle2 size={36} className="mx-auto mb-2 text-green-400" />
              <p className="text-sm font-medium text-gray-600">Nenhum duplicado encontrado</p>
            </div>
          ) : groups.map(group => {
            const key = group.campo
            const isExpanded = expanded === key
            const isMerging = merging === key
            const isMerged = merged.has(key)
            const currentWinner = winnerId[key] ?? group.contatos[0].id

            return (
              <div key={key} className={`border rounded-xl overflow-hidden transition-colors ${isMerged ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                {/* Linha principal */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tab === 'phone' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {tab === 'phone'
                        ? <Phone size={13} className="text-blue-600" />
                        : <Mail size={13} className="text-purple-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{key}</p>
                      <p className="text-xs text-gray-400">{group.contatos.length} contatos com {tab === 'phone' ? 'este telefone' : 'este e-mail'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMerged ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 size={13} /> Mesclado
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMerge(group)}
                        disabled={isMerging}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <GitMerge size={12} />
                        {isMerging ? 'Mesclando...' : 'Mesclar'}
                      </button>
                    )}
                    <button
                      onClick={() => toggleExpand(key)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      {isExpanded ? 'Ocultar' : 'Ver contatos'}
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {/* Contatos expandidos */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <div className="grid grid-cols-5 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <span>Manter</span>
                      <span>Nome</span>
                      <span>E-mail</span>
                      <span>Telefone</span>
                      <span>Listas</span>
                    </div>
                    {group.contatos.map(c => (
                      <div
                        key={c.id}
                        className={`grid grid-cols-5 items-center px-4 py-3 border-t border-gray-50 transition-colors cursor-pointer ${
                          currentWinner === c.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => selectWinner(key, c.id)}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            currentWinner === c.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                          }`}>
                            {currentWinner === c.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-800 truncate pr-2">{c.nome}</p>
                        <p className="text-xs text-gray-500 truncate pr-2">{c.email ?? '—'}</p>
                        <p className="text-xs text-gray-500 truncate pr-2">{c.numero ?? '—'}</p>
                        <div className="flex flex-wrap gap-1">
                          {(c.tags ?? []).slice(0, 2).map(t => (
                            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-400">Selecione qual contato manter. Os dados dos outros serão mesclados e eles serão removidos.</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400">
            {groups.filter(g => !merged.has(g.campo)).length} grupo{groups.filter(g => !merged.has(g.campo)).length !== 1 ? 's' : ''} pendente{groups.filter(g => !merged.has(g.campo)).length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => { onClose(); window.location.reload() }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {merged.size > 0 ? 'Fechar e atualizar' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  )
}
