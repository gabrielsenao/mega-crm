'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getOrigens() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('origens')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createOrigem(nome: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('origens')
    .insert({ nome, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  revalidatePath('/')
  return data
}

export async function deleteOrigem(id: string) {
  const supabase = await createClient()
  await supabase.from('origens').delete().eq('id', id)
  revalidatePath('/')
}

export async function getNegocios(origemId?: string) {
  const supabase = await createClient()
  let q = supabase.from('negocios').select('*').order('created_at', { ascending: true })
  if (origemId) q = q.eq('origem_id', origemId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function createNegocio(nome: string, origemId: string, etapas: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('negocios')
    .insert({ nome, origem_id: origemId, etapas, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  revalidatePath('/')
  return data
}

export async function deleteNegocio(id: string) {
  const supabase = await createClient()
  await supabase.from('negocios').delete().eq('id', id)
  revalidatePath('/')
}
