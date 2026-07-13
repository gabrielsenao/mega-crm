'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getContatos() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createContato(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  await supabase.from('contatos').insert({
    nome: formData.get('nome') as string,
    email: formData.get('email') as string || null,
    numero: formData.get('numero') as string || null,
    tags: (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(Boolean),
    informacoes_adicionais: formData.get('informacoes_adicionais') as string || null,
    user_id: user.id,
  })
  revalidatePath('/contatos')
}

export async function updateContato(id: string, formData: FormData) {
  const supabase = await createClient()
  await supabase.from('contatos').update({
    nome: formData.get('nome') as string,
    email: formData.get('email') as string || null,
    numero: formData.get('numero') as string || null,
    tags: (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(Boolean),
    informacoes_adicionais: formData.get('informacoes_adicionais') as string || null,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  revalidatePath('/contatos')
}

export async function deleteContato(id: string) {
  const supabase = await createClient()
  await supabase.from('contatos').delete().eq('id', id)
  revalidatePath('/contatos')
}

export async function getDuplicates() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error

  const byPhone = new Map<string, typeof data>()
  const byEmail = new Map<string, typeof data>()

  for (const c of data ?? []) {
    if (c.numero) {
      const key = c.numero.replace(/\D/g, '')
      if (key.length >= 8) {
        if (!byPhone.has(key)) byPhone.set(key, [])
        byPhone.get(key)!.push(c)
      }
    }
    if (c.email) {
      const key = c.email.toLowerCase().trim()
      if (!byEmail.has(key)) byEmail.set(key, [])
      byEmail.get(key)!.push(c)
    }
  }

  const dupPhone = Array.from(byPhone.entries())
    .filter(([, v]) => v.length > 1)
    .map(([campo, contatos]) => ({ campo, contatos }))

  const dupEmail = Array.from(byEmail.entries())
    .filter(([, v]) => v.length > 1)
    .map(([campo, contatos]) => ({ campo, contatos }))

  return { byPhone: dupPhone, byEmail: dupEmail }
}

export async function mergeContatos(winnerId: string, deleteIds: string[]) {
  const supabase = await createClient()

  // Busca todos os envolvidos
  const { data: todos } = await supabase
    .from('contatos')
    .select('*')
    .in('id', [winnerId, ...deleteIds])

  if (!todos?.length) return

  const winner = todos.find(c => c.id === winnerId)!
  const others = todos.filter(c => c.id !== winnerId)

  // Mescla campos ausentes do winner com os dos duplicados
  const emailMerged = winner.email ?? others.find(c => c.email)?.email ?? null
  const numeroMerged = winner.numero ?? others.find(c => c.numero)?.numero ?? null
  const infoMerged = winner.informacoes_adicionais ?? others.find(c => c.informacoes_adicionais)?.informacoes_adicionais ?? null
  const tagsMerged = Array.from(new Set([
    ...(winner.tags ?? []),
    ...others.flatMap(c => c.tags ?? []),
  ]))

  await supabase.from('contatos').update({
    email: emailMerged,
    numero: numeroMerged,
    informacoes_adicionais: infoMerged,
    tags: tagsMerged,
    updated_at: new Date().toISOString(),
  }).eq('id', winnerId)

  if (deleteIds.length > 0) {
    await supabase.from('contatos').delete().in('id', deleteIds)
  }

  revalidatePath('/contatos')
}

export async function importContatos(rows: { nome: string; email?: string; numero?: string; tags?: string }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const inserts = rows.map(r => ({
    nome: r.nome,
    email: r.email || null,
    numero: r.numero || null,
    tags: r.tags ? r.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    user_id: user.id,
  }))

  await supabase.from('contatos').insert(inserts)
  revalidatePath('/contatos')
}
