# Health Protocol — Módulo 1: Medicamentos

App web mobile-first para acompanhamento de medicamentos e exames laboratoriais.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (dark theme)
- Supabase (banco + futura auth)
- Deploy na Vercel

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

## Banco de dados

Antes de rodar, aplique o schema no Supabase rodando o conteúdo de `supabase/schema.sql` no SQL Editor do dashboard.

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha as chaves do Supabase.

## Estrutura

```
app/
  medications/         # Tela principal (timeline + perfil + água)
  medications/exams/   # Exames laboratoriais (semáforo + filtros)
  profile/             # Edição de perfil
components/
  medications/         # Card, Timeline, Header, MondayAlert, etc.
  exams/               # MarkerCard, CategoryFilter, ExamDashboard
hooks/
  useMedications, useTodaySchedule, useExams, useProfile, useWaterCounter
lib/
  supabase/            # client + types
  utils/               # medications, exams, profile, cn
supabase/
  schema.sql           # CREATE TABLE + seeds
```
