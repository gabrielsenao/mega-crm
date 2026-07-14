export type Column = string

export const COLUMNS: Column[] = ['Base', 'Agendamento', 'Fechados']

export interface Nota {
  id: string
  texto: string
  created_at: string
}

export type LeadStatus = 'ativo' | 'ganho' | 'perdido'

export interface Lead {
  id: string
  nome: string
  email: string | null
  numero: string | null
  informacoes_adicionais: string | null
  coluna: Column
  posicao: number
  dono: string | null
  notas: Nota[]
  negocio_id: string | null
  status: LeadStatus
  motivo_perda: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface Origem {
  id: string
  nome: string
  user_id: string
  created_at: string
}

export interface Negocio {
  id: string
  nome: string
  origem_id: string
  etapas: string[]
  motivos_perda?: string[]
  user_id: string
  created_at: string
}

export type TipoTarefa = 'ligacao' | 'whatsapp' | 'email' | 'tarefa'

export interface TarefaEtapa {
  id: string
  negocio_id: string
  etapa: string
  tipo: TipoTarefa
  titulo: string
  descricao: string | null
  dia: number
  horario: string | null
  ordem: number
  user_id: string
  created_at: string
}

export interface TarefaLead {
  id: string
  lead_id: string
  tarefa_etapa_id: string | null
  tipo: TipoTarefa
  titulo: string
  descricao: string | null
  concluida: boolean
  data_prevista: string | null
  data_conclusao: string | null
  user_id: string
  created_at: string
}

export interface Contato {
  id: string
  nome: string
  email: string | null
  numero: string | null
  tags: string[]
  informacoes_adicionais: string | null
  user_id: string
  created_at: string
  updated_at: string
}
