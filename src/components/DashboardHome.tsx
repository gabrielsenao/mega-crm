'use client'

import { Lead, Negocio, Origem } from '@/types'
import { UserPlus, Upload, LayoutGrid, Users, ArrowRight, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

interface Props {
  leads: Lead[]
  negocios: Negocio[]
  origens: Origem[]
  email: string
  onNewLead: () => void
  onImport: () => void
  onSelectNegocio: (neg: Negocio) => void
}

export default function DashboardHome({ leads, negocios, origens, email, onNewLead, onImport, onSelectNegocio }: Props) {
  const nome = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const recentes = [...leads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  const totalHoje = leads.filter(l => {
    const d = new Date(l.created_at)
    const hoje = new Date()
    return d.toDateString() === hoje.toDateString()
  }).length

  function initials(nome: string) {
    return nome.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `há ${days} dia${days > 1 ? 's' : ''}`
    if (hours > 0) return `há ${hours}h`
    if (mins > 0) return `há ${mins}min`
    return 'agora'
  }

  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500',
  ]
  function avatarColor(nome: string) {
    let h = 0
    for (const c of nome) h = (h * 31 + c.charCodeAt(0)) % colors.length
    return colors[h]
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Banner de boas-vindas */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-violet-800 px-8 py-10">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <h1 className="text-2xl font-bold text-white mb-1">Bem-vindo ao Mega, {nome}</h1>
        <p className="text-violet-200 text-sm">
          {leads.length.toLocaleString('pt-BR')} leads cadastrados &middot; {totalHoje} novos hoje
        </p>
      </div>

      <div className="px-8 py-6 max-w-5xl">

        {/* Ações rápidas */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ações rápidas</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <button
            onClick={onNewLead}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-50 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
              <UserPlus size={18} className="text-violet-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Novo lead</span>
          </button>

          <button
            onClick={onImport}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <Upload size={18} className="text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Importar CSV</span>
          </button>

          <Link
            href="/contatos"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
              <Users size={18} className="text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Contatos</span>
          </Link>

          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-orange-400" />
            </div>
            <span className="text-xs font-medium text-gray-400">Indicadores</span>
            <span className="text-[10px] text-gray-300">em breve</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* Negócios */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Negócios</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {negocios.length === 0 ? (
                <p className="px-4 py-6 text-xs text-gray-400 text-center">Nenhum negócio criado ainda</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {negocios.map(neg => {
                    const origem = origens.find(o => o.id === neg.origem_id)
                    const count = leads.filter(l => l.negocio_id === neg.id).length
                    return (
                      <button
                        key={neg.id}
                        onClick={() => onSelectNegocio(neg)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                          <LayoutGrid size={13} className="text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{neg.nome}</p>
                          {origem && <p className="text-[11px] text-gray-400 truncate">{origem.nome}</p>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">{count}</span>
                          <ArrowRight size={12} className="text-gray-300 group-hover:text-violet-500 transition-colors" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Leads recentes */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Leads recentes</p>
              <Clock size={12} className="text-gray-300" />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {recentes.length === 0 ? (
                <p className="px-4 py-6 text-xs text-gray-400 text-center">Nenhum lead ainda</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentes.map(lead => {
                    const neg = negocios.find(n => n.id === lead.negocio_id)
                    return (
                      <div key={lead.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${avatarColor(lead.nome)}`}>
                          {initials(lead.nome)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{lead.nome}</p>
                          <div className="flex items-center gap-1.5">
                            {neg && (
                              <span className="text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                                {neg.nome}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">{lead.coluna}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-gray-300 flex-shrink-0">{timeAgo(lead.created_at)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
