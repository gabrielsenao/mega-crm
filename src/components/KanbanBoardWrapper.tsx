'use client'

import { useState } from 'react'
import { Lead, Origem, Negocio, COLUMNS } from '@/types'
import Navbar from './Navbar'
import KanbanBoard from './KanbanBoard'
import LeadModal from './LeadModal'
import ImportLeadsModal from './ImportLeadsModal'
import NovaOrigemModal from './NovaOrigemModal'
import NovoNegocioModal from './NovoNegocioModal'
import { ChevronDown, ChevronRight, Plus, LayoutGrid, Building2, Settings, Download, RefreshCw, Home, MoreHorizontal, Trash2 } from 'lucide-react'
import { deleteOrigem } from '@/app/actions/negocios'
import ConfigNegocioModal from './ConfigNegocioModal'
import DashboardHome from './DashboardHome'

interface Props {
  leads: Lead[]
  origens: Origem[]
  negocios: Negocio[]
  email: string
}

export default function KanbanBoardWrapper({ leads, origens: initialOrigens, negocios: initialNegocios, email }: Props) {
  const [origens, setOrigens] = useState<Origem[]>(initialOrigens)
  const [negocios, setNegocios] = useState<Negocio[]>(initialNegocios)

  const [showNewLead, setShowNewLead] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showNovaOrigem, setShowNovaOrigem] = useState(false)
  const [novoNegocioOrigemId, setNovoNegocioOrigemId] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [origemMenuAberto, setOrigemMenuAberto] = useState<string | null>(null)

  // Origem expandida no sidebar
  const [origemExpandida, setOrigemExpandida] = useState<string | null>(
    initialOrigens[0]?.id ?? null
  )

  // Negócio selecionado (null = dashboard home)
  const [negocioAtivo, setNegocioAtivo] = useState<Negocio | null>(null)

  const etapasAtivas = negocioAtivo?.etapas ?? COLUMNS

  async function handleDeleteOrigem(id: string) {
    await deleteOrigem(id)
    setOrigens(prev => prev.filter(o => o.id !== id))
    setNegocios(prev => prev.filter(n => n.origem_id !== id))
    if (negocioAtivo && negocios.find(n => n.origem_id === id && n.id === negocioAtivo.id)) {
      setNegocioAtivo(null)
    }
    setOrigemMenuAberto(null)
  }

  function handleOrigemCreated(orig: Origem) {
    setOrigens(prev => [...prev, orig])
    setOrigemExpandida(orig.id)
  }

  function handleNegocioCreated(neg: Negocio) {
    setNegocios(prev => [...prev, neg])
    setNegocioAtivo(neg)
  }

  function handleNegocioUpdated(neg: Negocio) {
    setNegocios(prev => prev.map(n => n.id === neg.id ? neg : n))
    setNegocioAtivo(neg)
  }

  function exportLeadsCSV() {
    const leadsNegocio = negocioAtivo
      ? leads.filter(l => l.negocio_id === negocioAtivo.id)
      : leads
    const header = 'Nome,Email,Número,Etapa,Tags,Dono'
    const rows = leadsNegocio.map(l =>
      [l.nome, l.email ?? '', l.numero ?? '', l.coluna, l.informacoes_adicionais ?? '', l.dono ?? '']
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${negocioAtivo?.nome ?? 'todos'}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const origemDoNegocioAtivo = negocioAtivo
    ? origens.find(o => o.id === negocioAtivo.origem_id)
    : null

  const novoNegocioOrigem = novoNegocioOrigemId
    ? origens.find(o => o.id === novoNegocioOrigemId)
    : null

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar email={email} isHome={negocioAtivo === null} onHome={() => setNegocioAtivo(null)} onNewLead={() => setShowNewLead(true)} onImportLeads={() => setShowImport(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
          <div className="px-3 pt-3 pb-4">

            {/* Cabeçalho Origens */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Origens</span>
              <button
                onClick={() => setShowNovaOrigem(true)}
                title="Nova origem"
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Lista de Origens */}
            {origens.length === 0 ? (
              <button
                onClick={() => setShowNovaOrigem(true)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg border border-dashed border-gray-200 text-gray-400 text-xs hover:border-violet-300 hover:text-violet-500 transition-colors"
              >
                <Plus size={11} />
                Criar primeira origem
              </button>
            ) : (
              <div className="space-y-0.5">
                {origens.map(origem => {
                  const negOrigem = negocios.filter(n => n.origem_id === origem.id)
                  const expanded = origemExpandida === origem.id

                  return (
                    <div key={origem.id}>
                      {/* Linha da origem */}
                      <div className="flex items-center gap-1 group relative">
                        <button
                          onClick={() => setOrigemExpandida(expanded ? null : origem.id)}
                          className="flex items-center gap-1.5 flex-1 px-1.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left"
                        >
                          {expanded
                            ? <ChevronDown size={11} className="flex-shrink-0 text-gray-400" />
                            : <ChevronRight size={11} className="flex-shrink-0 text-gray-400" />
                          }
                          <Building2 size={11} className="flex-shrink-0 text-violet-500" />
                          <span className="truncate">{origem.nome}</span>
                        </button>
                        <button
                          onClick={() => setNovoNegocioOrigemId(origem.id)}
                          title="Novo negócio"
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-all flex-shrink-0"
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          onClick={() => setOrigemMenuAberto(origemMenuAberto === origem.id ? null : origem.id)}
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all flex-shrink-0"
                        >
                          <MoreHorizontal size={11} />
                        </button>
                        {origemMenuAberto === origem.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOrigemMenuAberto(null)} />
                            <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                              <button
                                onClick={() => handleDeleteOrigem(origem.id)}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={11} />
                                Excluir origem
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Negócios da origem */}
                      {expanded && (
                        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
                          {negOrigem.length === 0 ? (
                            <button
                              onClick={() => setNovoNegocioOrigemId(origem.id)}
                              className="w-full flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:text-violet-500 transition-colors"
                            >
                              <Plus size={10} />
                              Novo negócio
                            </button>
                          ) : (
                            negOrigem.map(neg => (
                              <button
                                key={neg.id}
                                onClick={() => setNegocioAtivo(neg)}
                                className={`flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                                  negocioAtivo?.id === neg.id
                                    ? 'bg-violet-50 text-violet-700 font-semibold'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <LayoutGrid size={10} className="flex-shrink-0" />
                                <span className="truncate flex-1">{neg.nome}</span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                  {leads.filter(l => l.negocio_id === neg.id).length}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

          </div>
        </aside>

        {/* ── Conteúdo principal ── */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {negocioAtivo ? (
            <>
              <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    {origemDoNegocioAtivo?.nome ?? 'Negócios'}
                  </p>
                  <h1 className="text-xl font-bold text-gray-900">{negocioAtivo.nome}</h1>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setNegocioAtivo(null)}
                    title="Início"
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Home size={15} />
                  </button>
                  <button
                    onClick={() => { setRefreshKey(k => k + 1); window.location.reload() }}
                    title="Recarregar"
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <RefreshCw size={15} />
                  </button>
                  <button
                    onClick={exportLeadsCSV}
                    title="Exportar leads"
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={() => setShowConfig(true)}
                    title="Configurações do negócio"
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Settings size={15} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden px-5 pb-4">
                <KanbanBoard
                  initialLeads={leads}
                  onNewLead={() => setShowNewLead(true)}
                  negocioAtivo={negocioAtivo}
                  etapas={etapasAtivas}
                  negocios={negocios}
                  origens={origens}
                />
              </div>
            </>
          ) : (
            <DashboardHome
              leads={leads}
              negocios={negocios}
              origens={origens}
              email={email}
              onNewLead={() => setShowNewLead(true)}
              onImport={() => setShowImport(true)}
              onSelectNegocio={setNegocioAtivo}
            />
          )}
        </main>
      </div>

      {/* Modais */}
      {showNewLead && (
        <LeadModal onClose={() => setShowNewLead(false)} negocioId={negocioAtivo?.id ?? null} />
      )}
      {showImport && (
        <ImportLeadsModal
          onClose={() => setShowImport(false)}
          origemAtiva={negocioAtivo?.nome ?? 'Geral'}
          negocioId={negocioAtivo?.id ?? null}
        />
      )}
      {showNovaOrigem && (
        <NovaOrigemModal
          onClose={() => setShowNovaOrigem(false)}
          onCreated={handleOrigemCreated}
        />
      )}
      {novoNegocioOrigemId && novoNegocioOrigem && (
        <NovoNegocioModal
          origemId={novoNegocioOrigemId}
          origemNome={novoNegocioOrigem.nome}
          onClose={() => setNovoNegocioOrigemId(null)}
          onCreated={handleNegocioCreated}
        />
      )}
      {showConfig && negocioAtivo && (
        <ConfigNegocioModal
          negocio={negocioAtivo}
          onClose={() => setShowConfig(false)}
          onUpdated={handleNegocioUpdated}
        />
      )}
    </div>
  )
}
