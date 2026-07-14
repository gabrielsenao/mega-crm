'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TipoTarefa } from '@/types'

// ── Tarefas de etapa (templates) ──────────────────────────────────────────────

export async function getTarefasEtapa(negocioId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tarefas_etapa')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('etapa')
    .order('dia')
    .order('ordem')
  if (error) throw error
  return data ?? []
}

export async function createTarefaEtapa(fields: {
  negocio_id: string
  etapa: string
  tipo: TipoTarefa
  titulo: string
  descricao?: string
  dia: number
  horario?: string
  ordem: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('tarefas_etapa')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  revalidatePath('/')
  return data
}

export async function deleteTarefaEtapa(id: string) {
  const supabase = await createClient()
  await supabase.from('tarefas_etapa').delete().eq('id', id)
  revalidatePath('/')
}

export async function updateTarefaEtapa(id: string, fields: Partial<{
  titulo: string
  descricao: string
  tipo: TipoTarefa
  dia: number
  horario: string
}>) {
  const supabase = await createClient()
  await supabase.from('tarefas_etapa').update(fields).eq('id', id)
  revalidatePath('/')
}

// ── Tarefas do lead ───────────────────────────────────────────────────────────

export async function getTarefasLead(leadId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tarefas_lead')
    .select('*')
    .eq('lead_id', leadId)
    .order('data_prevista', { ascending: true, nullsFirst: false })
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function criarTarefasParaEtapa(leadId: string, negocioId: string, etapa: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: templates } = await supabase
    .from('tarefas_etapa')
    .select('*')
    .eq('negocio_id', negocioId)
    .eq('etapa', etapa)
    .order('dia')

  if (!templates?.length) return

  const agora = new Date()
  const inserts = templates.map(t => {
    const dataPrevista = new Date(agora)
    dataPrevista.setDate(dataPrevista.getDate() + (t.dia - 1))
    if (t.horario) {
      const [h, m] = t.horario.split(':')
      dataPrevista.setHours(parseInt(h), parseInt(m), 0, 0)
    }
    return {
      lead_id: leadId,
      tarefa_etapa_id: t.id,
      tipo: t.tipo,
      titulo: t.titulo,
      descricao: t.descricao,
      data_prevista: dataPrevista.toISOString(),
      concluida: false,
      user_id: user.id,
    }
  })

  await supabase.from('tarefas_lead').insert(inserts)
  revalidatePath('/')
}

export async function concluirTarefa(id: string, concluida: boolean) {
  const supabase = await createClient()
  await supabase.from('tarefas_lead').update({
    concluida,
    data_conclusao: concluida ? new Date().toISOString() : null,
  }).eq('id', id)
  revalidatePath('/')
}

export async function createTarefaManual(leadId: string, fields: {
  tipo: TipoTarefa
  titulo: string
  descricao?: string
  data_prevista?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  await supabase.from('tarefas_lead').insert({
    lead_id: leadId,
    tipo: fields.tipo,
    titulo: fields.titulo,
    descricao: fields.descricao ?? null,
    data_prevista: fields.data_prevista ?? null,
    concluida: false,
    user_id: user.id,
  })
  revalidatePath('/')
}

export async function deleteTarefaLead(id: string) {
  const supabase = await createClient()
  await supabase.from('tarefas_lead').delete().eq('id', id)
  revalidatePath('/')
}
