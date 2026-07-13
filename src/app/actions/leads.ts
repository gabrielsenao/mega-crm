'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Column } from '@/types'

export async function getLeads() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('posicao', { ascending: true })

  if (error) throw error
  return data
}

export async function createLead(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('coluna', 'Base')

  const negocioId = formData.get('negocio_id') as string | null

  await supabase.from('leads').insert({
    nome: formData.get('nome') as string,
    email: formData.get('email') as string || null,
    numero: formData.get('numero') as string || null,
    informacoes_adicionais: formData.get('informacoes_adicionais') as string || null,
    coluna: 'Base',
    posicao: (count ?? 0),
    negocio_id: negocioId || null,
    user_id: user.id,
  })

  revalidatePath('/')
}

export async function updateLead(id: string, formData: FormData) {
  const supabase = await createClient()

  await supabase.from('leads').update({
    nome: formData.get('nome') as string,
    email: formData.get('email') as string || null,
    numero: formData.get('numero') as string || null,
    informacoes_adicionais: formData.get('informacoes_adicionais') as string || null,
    dono: formData.get('dono') as string || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  revalidatePath('/')
}

export async function addNota(leadId: string, texto: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('leads').select('notas').eq('id', leadId).single()
  const notas = (data?.notas ?? []) as { id: string; texto: string; created_at: string }[]
  const nova = { id: crypto.randomUUID(), texto, created_at: new Date().toISOString() }
  await supabase.from('leads').update({ notas: [...notas, nova] }).eq('id', leadId)
  revalidatePath('/')
}

export async function deleteNota(leadId: string, notaId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('leads').select('notas').eq('id', leadId).single()
  const notas = (data?.notas ?? []) as { id: string; texto: string; created_at: string }[]
  await supabase.from('leads').update({ notas: notas.filter(n => n.id !== notaId) }).eq('id', leadId)
  revalidatePath('/')
}

export async function updateLeadDono(id: string, dono: string | null) {
  const supabase = await createClient()
  await supabase.from('leads').update({
    dono: dono || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  revalidatePath('/')
}

export async function deleteLead(id: string) {
  const supabase = await createClient()
  await supabase.from('leads').delete().eq('id', id)
  revalidatePath('/')
}

export async function moveLeadColumn(id: string, coluna: Column, posicao: number) {
  const supabase = await createClient()
  await supabase.from('leads').update({
    coluna,
    posicao,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  revalidatePath('/')
}

export async function importLeads(leadsJson: string, origem = 'InLead', negocioId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const leads = JSON.parse(leadsJson) as Array<{
    nome: string
    email: string | null
    numero: string | null
    informacoes_adicionais: string | null
    coluna: 'Base' | 'Agendamento' | 'Fechados'
  }>

  const BATCH = 100
  let ok = 0
  let err = 0

  for (let i = 0; i < leads.length; i += BATCH) {
    const slice = leads.slice(i, i + BATCH)

    const leadsBatch = slice.map((l, idx) => ({
      ...l,
      posicao: i + idx,
      negocio_id: negocioId ?? null,
      user_id: user.id,
    }))
    const { error: leadsErr } = await supabase.from('leads').insert(leadsBatch)

    const contatosBatch = slice.map(l => ({
      nome: l.nome,
      email: l.email,
      numero: l.numero,
      tags: [origem, ...(l.informacoes_adicionais ? [l.informacoes_adicionais] : [])].filter(Boolean),
      informacoes_adicionais: null,
      user_id: user.id,
    }))
    await supabase.from('contatos').insert(contatosBatch)

    if (leadsErr) err += slice.length
    else ok += slice.length
  }

  revalidatePath('/')
  revalidatePath('/contatos')
  return { ok, err }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}
