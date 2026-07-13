import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  // Autenticação via API key
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')
  if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido — envie JSON' }, { status: 400 })
  }

  const nome = (body.nome as string | undefined)?.trim()
  const email = (body.email as string | undefined)?.trim() || null
  const telefone = (body.telefone as string | undefined)?.trim() || null
  const tag = (body.tag as string | undefined)?.trim() || null

  if (!nome) {
    return NextResponse.json({ error: 'O campo "nome" é obrigatório' }, { status: 422 })
  }

  // Conta os leads existentes na coluna Base para definir posição
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('coluna', 'Base')

  const { data, error } = await supabase.from('leads').insert({
    nome,
    email,
    numero: telefone,
    informacoes_adicionais: tag,
    coluna: 'Base',
    posicao: count ?? 0,
    user_id: process.env.OWNER_USER_ID!,
  }).select('id, nome, email, numero, informacoes_adicionais, coluna, created_at').single()

  if (error) {
    console.error('[API /leads]', error)
    return NextResponse.json({ error: 'Erro ao criar lead' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, lead: data }, { status: 201 })
}

// Responde OPTIONS para CORS (caso InLead faça preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    },
  })
}
