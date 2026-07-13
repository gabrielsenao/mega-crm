export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ContatosList from '@/components/ContatosList'

const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

export default async function ContatosPage() {
  if (DEMO_MODE) {
    return <ContatosList contatos={[]} email="demo@mega.com" />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }

  const { getContatos } = await import('@/app/actions/contatos')
  const contatos = await getContatos()

  return <ContatosList contatos={contatos} email={user!.email ?? ''} />
}
