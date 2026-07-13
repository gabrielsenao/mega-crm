'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Upload, ChevronDown, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import { importLeads } from '@/app/actions/leads'

type Step = 1 | 2 | 3

interface ParsedCSV {
  headers: string[]
  rows: string[][]
}

interface FieldMap {
  nome: string
  email: string
  telefone: string
  informacoes: string
  etapa: string
}

const MEGA_FIELDS = [
  { key: 'nome', label: 'Nome' },
  { key: 'email', label: 'E-mail' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'informacoes', label: 'Informações / Tags' },
  { key: 'etapa', label: 'Etapa' },
]

const ETAPAS = ['Base', 'Agendamento', 'Fechados']

function parseCSV(text: string): ParsedCSV {
  const lines = text.split('\n').filter(l => l.trim())

  function parseLine(line: string): string[] {
    const result: string[] = []
    let inQuotes = false
    let current = ''
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map(parseLine)
  return { headers, rows }
}

function autoDetect(headers: string[]): FieldMap {
  const h = headers.map(h => h.toLowerCase())
  const find = (...keys: string[]) => {
    for (const k of keys) {
      const idx = h.findIndex(header => header.includes(k))
      if (idx >= 0) return headers[idx]
    }
    return ''
  }
  return {
    nome: find('name', 'nome'),
    email: find('email'),
    telefone: find('complete_phone', 'phone', 'telefone', 'numero'),
    informacoes: find('tags', 'tag', 'informac'),
    etapa: find('stage', 'etapa', 'coluna'),
  }
}

function getColValue(row: string[], headers: string[], col: string): string {
  if (!col) return ''
  const idx = headers.indexOf(col)
  return idx >= 0 ? (row[idx] ?? '') : ''
}

function mapEtapa(val: string): 'Base' | 'Agendamento' | 'Fechados' {
  const v = (val || '').toLowerCase()
  if (v.includes('agend') || v.includes('dia')) return 'Agendamento'
  if (v.includes('fecha') || v.includes('won') || v.includes('ganho')) return 'Fechados'
  return 'Base'
}

interface Props {
  onClose: () => void
  origemAtiva?: string
  negocioId?: string | null
}

export default function ImportLeadsModal({ onClose, origemAtiva = 'InLead', negocioId }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [csv, setCsv] = useState<ParsedCSV | null>(null)
  const [fileName, setFileName] = useState('')
  const [fieldMap, setFieldMap] = useState<FieldMap>({ nome: '', email: '', telefone: '', informacoes: '', etapa: '' })
  const [etapaPadrao, setEtapaPadrao] = useState<'Base' | 'Agendamento' | 'Fechados'>('Base')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ ok: number; err: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setCsv(parsed)
      setFieldMap(autoDetect(parsed.headers))
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const previewLeads = csv ? csv.rows.slice(0, 5).map(row => ({
    nome: getColValue(row, csv.headers, fieldMap.nome),
    email: getColValue(row, csv.headers, fieldMap.email),
    telefone: getColValue(row, csv.headers, fieldMap.telefone),
    informacoes: getColValue(row, csv.headers, fieldMap.informacoes),
    etapa: fieldMap.etapa
      ? mapEtapa(getColValue(row, csv.headers, fieldMap.etapa))
      : etapaPadrao,
  })) : []

  async function handleImport() {
    if (!csv) return
    setImporting(true)

    const leads = csv.rows
      .filter(row => row.some(c => c))
      .map(row => ({
        nome: getColValue(row, csv.headers, fieldMap.nome) || 'Sem nome',
        email: getColValue(row, csv.headers, fieldMap.email) || null,
        numero: getColValue(row, csv.headers, fieldMap.telefone) || null,
        informacoes_adicionais: getColValue(row, csv.headers, fieldMap.informacoes) || null,
        coluna: (fieldMap.etapa
          ? mapEtapa(getColValue(row, csv.headers, fieldMap.etapa))
          : etapaPadrao) as 'Base' | 'Agendamento' | 'Fechados',
      }))

    const res = await importLeads(JSON.stringify(leads), origemAtiva, negocioId ?? undefined)
    setResult(res)
    setImporting(false)
    setStep(3)
  }

  const SelectField = ({ field }: { field: keyof FieldMap }) => (
    <div className="relative">
      <select
        value={fieldMap[field]}
        onChange={e => setFieldMap(prev => ({ ...prev, [field]: e.target.value }))}
        className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
      >
        <option value="">-- Não importar --</option>
        {csv?.headers.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step > s ? 'bg-blue-600 text-white' :
                  step === s ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                <span className={`text-xs font-medium ${step === s ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s === 1 ? 'Arquivo' : s === 2 ? 'Campos' : 'Confirmar'}
                </span>
                {s < 3 && <div className="w-8 h-px bg-gray-200" />}
              </div>
            ))}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Step 1: Upload */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Escolha o arquivo CSV</h2>
              <p className="text-sm text-gray-500 mb-5">Importe negócios exportados do Clint ou de outra ferramenta</p>

              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Upload size={32} className="mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {csv ? fileName : 'Arraste o arquivo ou clique para selecionar'}
                </p>
                {csv ? (
                  <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 size={13} /> {csv.rows.length} linhas encontradas
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Apenas arquivos .CSV</p>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </div>

              {csv && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prévia</p>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          {csv.headers.slice(0, 6).map(h => (
                            <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>
                          ))}
                          {csv.headers.length > 6 && <th className="px-3 py-2 text-gray-400">+{csv.headers.length - 6}</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {csv.rows.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            {row.slice(0, 6).map((cell, j) => (
                              <td key={j} className="px-3 py-2 text-gray-700 max-w-[120px] truncate">{cell || '-'}</td>
                            ))}
                            {row.length > 6 && <td className="px-3 py-2 text-gray-400">...</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Field mapping */}
          {step === 2 && csv && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Mapeamento de campos</h2>
              <p className="text-sm text-gray-500 mb-5">
                Arquivo: <span className="font-medium text-gray-700">{fileName}</span> — {csv.rows.length} linhas
              </p>

              <div className="space-y-3">
                {MEGA_FIELDS.map(f => (
                  <div key={f.key} className="grid grid-cols-2 gap-4 items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{f.label}</p>
                      <p className="text-xs text-gray-400">Campo no Mega</p>
                    </div>
                    <SelectField field={f.key as keyof FieldMap} />
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Etapa padrão</p>
                    <p className="text-xs text-gray-400">Usada quando a coluna Etapa não estiver mapeada</p>
                  </div>
                  <div className="relative">
                    <select
                      value={etapaPadrao}
                      onChange={e => setEtapaPadrao(e.target.value as typeof etapaPadrao)}
                      className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    >
                      {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview or result */}
          {step === 3 && (
            <div>
              {result ? (
                <div className="text-center py-8">
                  {result.err === 0 ? (
                    <>
                      <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{result.ok} leads importados!</h2>
                      <p className="text-sm text-gray-500">O kanban foi atualizado com os novos negócios.</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={48} className="mx-auto mb-3 text-yellow-500" />
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{result.ok} importados, {result.err} erros</h2>
                      <p className="text-sm text-gray-500">Alguns leads não puderam ser importados.</p>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Confirmar importação</h2>
                  <p className="text-sm text-gray-500 mb-5">
                    {csv!.rows.length} leads serão importados. Prévia dos primeiros 5:
                  </p>

                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left text-gray-500 font-medium">Nome</th>
                          <th className="px-3 py-2 text-left text-gray-500 font-medium">E-mail</th>
                          <th className="px-3 py-2 text-left text-gray-500 font-medium">Telefone</th>
                          <th className="px-3 py-2 text-left text-gray-500 font-medium">Tags/Info</th>
                          <th className="px-3 py-2 text-left text-gray-500 font-medium">Etapa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewLeads.map((lead, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-800 font-medium max-w-[140px] truncate">{lead.nome || '-'}</td>
                            <td className="px-3 py-2 text-gray-600 max-w-[140px] truncate">{lead.email || '-'}</td>
                            <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{lead.telefone || '-'}</td>
                            <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{lead.informacoes || '-'}</td>
                            <td className="px-3 py-2">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{lead.etapa}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <FileText size={13} />
                    <span>Total: <strong className="text-gray-800">{csv!.rows.length} leads</strong> serão importados para o kanban</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
          {result ? (
            <button
              onClick={onClose}
              className="ml-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Fechar
            </button>
          ) : (
            <>
              <button
                onClick={() => step > 1 ? setStep((step - 1) as Step) : onClose()}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {step === 1 ? 'Cancelar' : 'Voltar'}
              </button>

              {step === 1 && (
                <button
                  onClick={() => setStep(2)}
                  disabled={!csv}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Continuar
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  disabled={!fieldMap.nome}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Prévia
                </button>
              )}
              {step === 3 && !result && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Importando...
                    </>
                  ) : 'Importar agora'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
