import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Profile } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "Chave de API não configurada. Adicione ANTHROPIC_API_KEY nas variáveis de ambiente da Vercel." },
      { status: 500 }
    );
  }

  const body = await request.json() as { profile: Profile | null };
  const { profile } = body;

  if (!profile) {
    return NextResponse.json({ message: "Perfil não encontrado." }, { status: 400 });
  }

  const birthDate = new Date(profile.birth_date);
  const age = new Date().getFullYear() - birthDate.getFullYear();

  const prompt = `Você é um especialista em nutrição clínica e musculação. Com base nos dados abaixo, gere recomendações personalizadas objetivas.

**Dados do paciente:**
- Nome: ${profile.name}
- Idade: ${age} anos
- Peso: ${profile.weight_kg} kg
- Altura: ${profile.height_cm} cm
- Horário de acordar: ${profile.wake_time}
- Horário de dormir: ${profile.sleep_time}

Gere:

## Plano Alimentar Sugerido
- Distribuição de macros (kcal, proteína, carboidrato, gordura)
- Horários de 5 a 6 refeições adequadas ao horário de sono/vigília
- 2 a 3 opções para cada refeição (café, almoço, lanche, jantar, ceia)

## Série de Musculação Sugerida
- Frequência semanal (ex: 4x por semana)
- Divisão de grupos musculares por dia
- Número de séries e repetições recomendadas
- Observações sobre recuperação articular (se relevante)

Responda em português, de forma clara e organizada.`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    const text = content.type === "text" ? content.text : "Geração concluída.";
    return NextResponse.json({ message: text });
  } catch {
    return NextResponse.json(
      { message: "Erro ao gerar recomendações. Tente novamente." },
      { status: 500 }
    );
  }
}
