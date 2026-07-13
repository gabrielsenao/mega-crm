export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ContatosList from '@/components/ContatosList'
import { getDuplicates } from '@/app/actions/contatos'

const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

export default async function ContatosPage() {
  if (DEMO_MODE) {
    return <ContatosList contatos={[]} email="demo@mega.com" duplicates={{ byPhone: [], byEmail: [] }} />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }

  const { getContatos } = await import('@/app/actions/contatos')
  const { getLeads } = await import('@/app/actions/leads')
  const [contatos, duplicates, leads] = await Promise.all([
    getContatos(),
    getDuplicates(),
    getLeads(),
  ])

  return <ContatosList contatos={contatos} email={user!.email ?? ''} duplicates={duplicates} leads={leads as any} />
}
