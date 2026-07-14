'use client'

import { LogOut, Plus, Upload } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/leads'

interface Props {
  email: string
  isHome?: boolean
  onHome?: () => void
  onNewLead?: () => void
  onNewContact?: () => void
  onImportLeads?: () => void
}

export default function Navbar({ email, isHome, onHome, onNewLead, onNewContact, onImportLeads }: Props) {
  const pathname = usePathname()
  const isContatos = pathname === '/contatos'
  const isNegocios = !isContatos && !isHome

  return (
    <header className="bg-white border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center px-6 h-14 gap-4">
        {/* Logo */}
        <button
          onClick={onHome}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-gray-900 text-base">Mega</span>
        </button>

        {/* Tabs */}
        <nav className="flex items-center gap-1 ml-4">
          <button
            onClick={onHome}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isHome
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Início
          </button>
          <Link
            href="/"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isNegocios
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Negócios
          </Link>
          <Link
            href="/contatos"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isContatos
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Contatos
          </Link>
        </nav>

        <div className="flex-1" />

        {/* Ação contextual */}
        {!isContatos && onImportLeads && (
          <button
            onClick={onImportLeads}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Upload size={15} />
            Importar
          </button>
        )}
        {!isContatos && onNewLead && (
          <button
            onClick={onNewLead}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            Novo lead
          </button>
        )}
        {isContatos && onNewContact && (
          <button
            onClick={onNewContact}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            Novo contato
          </button>
        )}

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-600 text-xs font-semibold">
              {email.charAt(0).toUpperCase()}
            </span>
          </div>
          <form action={logout}>
            <button type="submit" className="text-gray-400 hover:text-gray-600 transition-colors">
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
