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
