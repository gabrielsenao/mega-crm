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

  await supabase.from('leads').insert({
    nome: formData.get('nome') as string,
    email: formData.get('email') as string || null,
    numero: formData.get('numero') as string || null,
    informacoes_adicionais: formData.get('informacoes_adicionais') as string || null,
    coluna: 'Base',
    posicao: (count ?? 0),
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

export async function importLeads(leadsJson: string) {
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
    const batch = leads.slice(i, i + BATCH).map((l, idx) => ({
      ...l,
      posicao: i + idx,
      user_id: user.id,
    }))
    const { error } = await supabase.from('leads').insert(batch)
    if (error) err += batch.length
    else ok += batch.length
  }

  revalidatePath('/')
  return { ok, err }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}
