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

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}
