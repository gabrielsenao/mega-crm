export type Column = 'Base' | 'Agendamento' | 'Fechados'

export const COLUMNS: Column[] = ['Base', 'Agendamento', 'Fechados']

export interface Lead {
  id: string
  nome: string
  email: string | null
  numero: string | null
  informacoes_adicionais: string | null
  coluna: Column
  posicao: number
  dono: string | null
  user_id: string
  created_at: string
  updated_at: string
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
