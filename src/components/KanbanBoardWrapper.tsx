'use client'

import { useState } from 'react'
import { Lead } from '@/types'
import { COLUMNS } from '@/types'
import Navbar from './Navbar'
import KanbanBoard from './KanbanBoard'
import LeadModal from './LeadModal'
import { LayoutGrid, ChevronDown, ChevronRight, Upload } from 'lucide-react'
import ImportLeadsModal from './ImportLeadsModal'

interface Props {
  leads: Lead[]
  email: string
}

const ORIGENS = ['InLead', '3C Plus', 'Unnichat']

export default function KanbanBoardWrapper({ leads, email }: Props) {
  const [showNewLead, setShowNewLead] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [origemAtiva, setOrigemAtiva] = useState('InLead')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar email={email} onNewLead={() => setShowNewLead(true)} onImportLeads={() => setShowImport(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
          <div className="px-3 py-3">
            {/* Origens */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-1.5 w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 hover:text-gray-700"
            >
              {sidebarOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              Origens
            </button>

            {sidebarOpen && (
              <div className="space-y-0.5 ml-1">
                {ORIGENS.map(origem => (
                  <button
                    key={origem}
                    onClick={() => setOrigemAtiva(origem)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors text-left ${
                      origemAtiva === origem
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <LayoutGrid size={13} className="flex-shrink-0" />
                    {origem}
                  </button>
                ))}
              </div>
            )}

            {/* Etapas */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-1 px-1">
              Etapas
            </p>
            <div className="space-y-0.5 ml-1">
              {COLUMNS.map(col => {
                const count = leads.filter(l => l.coluna === col).length
                return (
                  <div
                    key={col}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm text-gray-500"
                  >
                    <span>{col}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-1.5">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-hidden flex flex-col px-5 py-4">
          <div className="mb-3 flex-shrink-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Negócios da origem</p>
            <h1 className="text-xl font-bold text-gray-900">{origemAtiva}</h1>
          </div>
          <div className="flex-1 overflow-hidden">
            <KanbanBoard initialLeads={leads} onNewLead={() => setShowNewLead(true)} />
          </div>
        </main>
      </div>

      {showNewLead && (
        <LeadModal onClose={() => setShowNewLead(false)} />
      )}
      {showImport && (
        <ImportLeadsModal onClose={() => setShowImport(false)} />
      )}
    </div>
  )
}

