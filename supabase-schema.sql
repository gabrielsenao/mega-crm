-- Execute este SQL no Supabase > SQL Editor

-- ── Tabela de Leads (Kanban) ──────────────────────────────────
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  numero text,
  informacoes_adicionais text,
  coluna text not null default 'Base' check (coluna in ('Base', 'Agendamento', 'Fechados')),
  posicao integer not null default 0,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table leads enable row level security;

create policy "Leads - usuarios autenticados" on leads
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── Tabela de Contatos ────────────────────────────────────────
create table if not exists contatos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  numero text,
  tags text[] default '{}',
  informacoes_adicionais text,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table contatos enable row level security;

create policy "Contatos - usuarios autenticados" on contatos
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
