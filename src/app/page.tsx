export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getLeads } from './actions/leads'
import KanbanBoardWrapper from '@/components/KanbanBoardWrapper'

const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url'

export default async function Home() {
  if (DEMO_MODE) {
    return <KanbanBoardWrapper leads={[]} origens={[]} negocios={[]} email="demo@mega.com" />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }

  const { getOrigens, getNegocios } = await import('./actions/negocios')
  const [leads, origens, negocios] = await Promise.all([
    getLeads(),
    getOrigens(),
    getNegocios(),
  ])
  return <KanbanBoardWrapper leads={leads} origens={origens} negocios={negocios} email={user!.email ?? ''} />
}
