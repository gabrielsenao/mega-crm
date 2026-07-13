export type Column = string

export const COLUMNS: Column[] = ['Base', 'Agendamento', 'Fechados']

export interface Nota {
  id: string
  texto: string
  created_at: string
}

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
