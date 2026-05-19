import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProfileDocument } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "Chave ANTHROPIC_API_KEY não configurada nas variáveis de ambiente da Vercel." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as {
    profile: Profile | null;
    type?: "nutrition" | "workout" | "both";
    documents?: ProfileDocument[];
  };

  const { profile, type = "both", documents = [] } = body;

  if (!profile) {
    return NextResponse.json({ message: "Perfil não encontrado." }, { status: 400 });
  }

  // Buscar documentos do banco se não foram enviados
  let docs = documents;
  if (docs.length === 0) {
    const supabase = createClient();
    const { data } = await supabase.from("profile_documents").select("*");
    docs = (data ?? []) as ProfileDocument[];
  }

  const birthDate = new Date(profile.birth_date);
  const age = new Date().getFullYear() - birthDate.getFullYear();

  const docContext =
    docs.length > 0
      ? docs
          .map((d) => `- [${d.doc_type}] ${d.title}${d.notes ? `: ${d.notes}` : ""}`)
          .join("\n")
      : "Nenhum documento anexado.";

  const baseProfile = `**Dados do paciente:**
- Nome: ${profile.name}
- Idade: ${age} anos
- Peso: ${profile.weight_kg} kg
- Altura: ${profile.height_cm} cm
- Horário de acordar: ${profile.wake_time}
- Horário de dormir: ${profile.sleep_time}`;

  const restrictions = `**Restrições Alimentares:**
${profile.food_restrictions?.trim() || "Nenhuma informada."}

**Restrições de Mobilidade / Lesões:**
${profile.mobility_restrictions?.trim() || "Nenhuma informada."}`;

  const docSection = `**Documentos e exames anexados:**
${docContext}`;

  let prompt = "";

  if (type === "nutrition") {
    prompt = `Você é um nutricionista clínico especializado. Com base nos dados abaixo, gere um plano alimentar personalizado RESPEITANDO ESTRITAMENTE as restrições alimentares informadas.

${baseProfile}

${restrictions}

${docSection}

**REGRA OBRIGATÓRIA**: Qualquer alimento que viole as restrições alimentares listadas deve ser EXCLUÍDO completamente do plano.

Gere:

## Plano Alimentar Personalizado

### Distribuição de Macros
- Calorias totais, proteína (g), carboidratos (g), gorduras (g)

### Grade de Refeições
Para cada refeição (café, almoço, lanche, jantar, ceia — conforme horários de acordar/dormir):
- 3 opções de prato (A, B, C)
- Estimativa de kcal e proteína por opção
- Todas as opções devem respeitar as restrições alimentares

### Suplementação Sugerida (se aplicável)

Responda em português, de forma clara, organizada e prática.`;

  } else if (type === "workout") {
    prompt = `Você é um personal trainer especializado em periodização e reabilitação. Com base nos dados abaixo, gere uma série de musculação personalizada RESPEITANDO ESTRITAMENTE as restrições de mobilidade e lesões informadas.

${baseProfile}

${restrictions}

${docSection}

**REGRA OBRIGATÓRIA**: Exercícios que agravem as lesões ou restrições de mobilidade listadas devem ser SUBSTITUÍDOS por alternativas seguras. Sempre justifique as adaptações feitas.

Gere:

## Série de Musculação Personalizada

### Frequência e Divisão
- Dias por semana, grupos musculares por sessão

### Série Completa
Para cada dia de treino:
- Nome da sessão (ex: Peito e Tríceps)
- Lista de exercícios com séries × repetições × descanso
- Adaptações para as lesões informadas (se houver)
- Técnicas especiais recomendadas (se aplicável)

### Periodização
- Duração recomendada desta série (semanas)
- Quando e como progredir de carga

Responda em português, de forma clara e detalhada.`;

  } else {
    prompt = `Você é um especialista em saúde integrativa (nutrição + musculação). Com base nos dados abaixo, gere recomendações completas RESPEITANDO ESTRITAMENTE todas as restrições informadas.

${baseProfile}

${restrictions}

${docSection}

**REGRA OBRIGATÓRIA**: As restrições alimentares e de mobilidade devem ser respeitadas em 100% das sugestões.

Gere:

## Plano Alimentar
- Distribuição de macros e grade de refeições com 3 opções por refeição

## Série de Musculação
- Divisão semanal, exercícios com séries/reps, adaptações para lesões

Responda em português, de forma organizada e prática.`;
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3072,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    const text = content.type === "text" ? content.text : "Geração concluída.";
    return NextResponse.json({ message: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ message: `Erro ao gerar: ${msg}` }, { status: 500 });
  }
}
