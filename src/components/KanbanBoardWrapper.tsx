'use client'

import { useState } from 'react'
import { Lead } from '@/types'
import Navbar from './Navbar'
import KanbanBoard from './KanbanBoard'
import LeadModal from './LeadModal'

interface Props {
  leads: Lead[]
  email: string
}

export default function KanbanBoardWrapper({ leads, email }: Props) {
  const [showNewLead, setShowNewLead] = useState(false)

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar email={email} onNewLead={() => setShowNewLead(true)} />
      <main className="flex-1 overflow-hidden px-6 py-5">
        <KanbanBoard initialLeads={leads} />
      </main>
      {showNewLead && (
        <LeadModal onClose={() => setShowNewLead(false)} />
      )}
    </div>
  )
}

