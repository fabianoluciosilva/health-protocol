import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProfileDocument } from "@/lib/supabase/types";

export const maxDuration = 60;

type MealItem = {
  day_of_week: number;
  meal_type: "breakfast" | "lunch" | "snack" | "dinner" | "ceia";
  meal_time: string;
  option_a: string;
  option_b: string;
  option_c: string;
  calories_est: number;
  protein_g: number;
};

type SplitItem = {
  day_of_week: number;
  split_name: string;
  split_description: string;
  is_rest_day: boolean;
  rest_type?: "active" | "complete";
  color?: string;
  exercise_ids?: string[];
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "Chave ANTHROPIC_API_KEY não configurada na Vercel." },
      { status: 500 }
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    profile: Profile | null;
    type?: "nutrition" | "workout";
    documents?: ProfileDocument[];
  };

  const { profile, type = "nutrition", documents = [] } = body;
  if (!profile) {
    return NextResponse.json({ message: "Perfil não encontrado." }, { status: 400 });
  }

  let docs = documents;
  if (docs.length === 0) {
    const { data } = await supabase.from("profile_documents").select("*");
    docs = (data ?? []) as ProfileDocument[];
  }

  const birthDate = new Date(profile.birth_date);
  const age = new Date().getFullYear() - birthDate.getFullYear();

  const docContext =
    docs.length > 0
      ? docs.map((d) => `- [${d.doc_type}] ${d.title}${d.notes ? `: ${d.notes}` : ""}`).join("\n")
      : "Nenhum documento anexado.";

  const baseContext = `**Dados do paciente:**
- Nome: ${profile.name}
- Idade: ${age} anos
- Peso: ${profile.weight_kg} kg
- Altura: ${profile.height_cm} cm
- Horário de acordar: ${profile.wake_time}
- Horário de dormir: ${profile.sleep_time}

**Restrições Alimentares:**
${profile.food_restrictions?.trim() || "Nenhuma informada."}

**Restrições de Mobilidade / Lesões:**
${profile.mobility_restrictions?.trim() || "Nenhuma informada."}

**Documentos e exames anexados:**
${docContext}`;

  const client = new Anthropic({ apiKey });

  try {
    if (type === "nutrition") {
      const prompt = `Você é um nutricionista clínico. Gere um plano alimentar PERSONALIZADO para 7 dias respeitando ESTRITAMENTE todas as restrições alimentares.

${baseContext}

**REGRAS OBRIGATÓRIAS:**
- Gere exatamente 35 refeições (5 refeições por dia × 7 dias)
- Tipos: breakfast, lunch, snack, dinner, ceia
- 3 opções (A, B, C) por refeição com proteínas, carboidratos e gorduras balanceados
- Calorias e proteína estimadas por opção (média das 3)
- Horários adequados ao acordar/dormir do paciente
- day_of_week: 0=domingo, 1=segunda, ..., 6=sábado
- Nenhuma opção pode violar as restrições alimentares listadas

Use a ferramenta save_nutrition_plan para retornar o plano.`;

      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        tools: [
          {
            name: "save_nutrition_plan",
            description: "Salva o plano alimentar com 35 refeições (5 por dia × 7 dias).",
            input_schema: {
              type: "object" as const,
              properties: {
                meals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day_of_week: { type: "number", description: "0=domingo a 6=sábado" },
                      meal_type: { type: "string", enum: ["breakfast", "lunch", "snack", "dinner", "ceia"] },
                      meal_time: { type: "string", description: "Horário HH:MM (24h)" },
                      option_a: { type: "string", description: "Opção A da refeição" },
                      option_b: { type: "string", description: "Opção B da refeição" },
                      option_c: { type: "string", description: "Opção C da refeição" },
                      calories_est: { type: "number" },
                      protein_g: { type: "number" },
                    },
                    required: ["day_of_week", "meal_type", "meal_time", "option_a", "option_b", "option_c", "calories_est", "protein_g"],
                  },
                },
              },
              required: ["meals"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "save_nutrition_plan" },
        messages: [{ role: "user", content: prompt }],
      });

      const toolUse = response.content.find((c) => c.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        return NextResponse.json({ message: "IA não retornou plano estruturado." }, { status: 500 });
      }

      const { meals } = toolUse.input as { meals: MealItem[] };
      if (!Array.isArray(meals) || meals.length === 0) {
        return NextResponse.json({ message: "Plano vazio retornado pela IA." }, { status: 500 });
      }

      // Substituir refeições do usuário
      await supabase.from("meals").delete().eq("user_id", user.id);

      const rows = meals.map((m) => ({
        user_id: user.id,
        day_of_week: m.day_of_week,
        meal_type: m.meal_type,
        meal_time: m.meal_time.length === 5 ? m.meal_time + ":00" : m.meal_time,
        option_a: m.option_a,
        option_b: m.option_b,
        option_c: m.option_c,
        calories_est: m.calories_est,
        protein_g: m.protein_g,
        notes: null,
        tags: null,
      }));

      const { error: insertError } = await supabase.from("meals").insert(rows);
      if (insertError) {
        return NextResponse.json(
          { message: "Erro ao salvar refeições: " + insertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Plano alimentar criado! ${meals.length} refeições adicionadas à aba Nutrição.`,
      });
    }

    // ─── WORKOUT ─────────────────────────────────────────────────────────
    const { data: exercisesData } = await supabase
      .from("exercises")
      .select("id, name, muscle_group_id, knee_safe, equipment, sets, reps, rest_seconds");
    const exercises = (exercisesData ?? []) as Array<{
      id: string; name: string; muscle_group_id: string;
      knee_safe: boolean; equipment: string | null;
      sets: number; reps: string; rest_seconds: number;
    }>;

    if (exercises.length === 0) {
      return NextResponse.json(
        { message: "Catálogo de exercícios está vazio. Não é possível gerar treino." },
        { status: 500 }
      );
    }

    const exerciseCatalog = exercises
      .map((e) => `- ${e.id}: ${e.name}${e.equipment ? ` (${e.equipment})` : ""}${e.knee_safe ? " [seguro para joelho]" : ""}`)
      .join("\n");

    const prompt = `Você é um personal trainer especialista em periodização e reabilitação. Gere uma série de musculação PERSONALIZADA para 7 dias da semana.

${baseContext}

**EXERCÍCIOS DISPONÍVEIS NO CATÁLOGO (use APENAS estes IDs):**
${exerciseCatalog}

**REGRAS OBRIGATÓRIAS:**
- Gere exatamente 7 splits (um para cada dia da semana, 0=domingo a 6=sábado)
- Inclua 1-2 dias de descanso (is_rest_day=true)
- Para dias de treino: 5-8 exercícios bem distribuídos
- USE APENAS os exercise_ids listados acima — não invente IDs
- Se houver restrição de joelho/lombar, evite exercícios incompatíveis (priorize knee_safe quando aplicável)
- Nomes de splits em português (ex: "Peito e Tríceps", "Pernas", "Descanso Ativo")
- Cores em hexadecimal (ex: #3b82f6, #22c55e, #a855f7, #f97316, #ef4444, #06b6d4)
- Para descanso, color sugerido: #64748b

Use a ferramenta save_workout_plan para retornar o plano.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [
        {
          name: "save_workout_plan",
          description: "Salva o plano de treino com 7 splits (um por dia da semana).",
          input_schema: {
            type: "object" as const,
            properties: {
              splits: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    day_of_week: { type: "number", description: "0=domingo a 6=sábado" },
                    split_name: { type: "string" },
                    split_description: { type: "string" },
                    is_rest_day: { type: "boolean" },
                    rest_type: { type: "string", enum: ["active", "complete"], description: "Apenas se is_rest_day=true" },
                    color: { type: "string", description: "Hex color #RRGGBB" },
                    exercise_ids: {
                      type: "array",
                      items: { type: "string" },
                      description: "IDs dos exercícios do catálogo (vazio se is_rest_day=true)",
                    },
                  },
                  required: ["day_of_week", "split_name", "split_description", "is_rest_day", "color"],
                },
              },
            },
            required: ["splits"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "save_workout_plan" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json({ message: "IA não retornou plano estruturado." }, { status: 500 });
    }

    const { splits } = toolUse.input as { splits: SplitItem[] };
    if (!Array.isArray(splits) || splits.length === 0) {
      return NextResponse.json({ message: "Plano de treino vazio." }, { status: 500 });
    }

    // Limpar splits e split_exercises antigos do usuário
    const { data: oldSplits } = await supabase
      .from("workout_splits")
      .select("id")
      .eq("user_id", user.id);
    if (oldSplits && oldSplits.length > 0) {
      const oldIds = (oldSplits as Array<{ id: string }>).map((s) => s.id);
      await supabase.from("split_exercises").delete().in("split_id", oldIds);
    }
    await supabase.from("workout_splits").delete().eq("user_id", user.id);

    const validIds = new Set(exercises.map((e) => e.id));
    let totalExercises = 0;

    for (const split of splits) {
      const { data: inserted, error: splitErr } = await supabase
        .from("workout_splits")
        .insert({
          user_id: user.id,
          day_of_week: split.day_of_week,
          split_name: split.split_name,
          split_description: split.split_description,
          is_rest_day: split.is_rest_day,
          rest_type: split.is_rest_day ? (split.rest_type ?? "complete") : null,
          color: split.color ?? "#3b82f6",
        })
        .select("id")
        .single();

      if (splitErr || !inserted) continue;

      if (!split.is_rest_day && split.exercise_ids && split.exercise_ids.length > 0) {
        const filtered = split.exercise_ids.filter((id) => validIds.has(id));
        if (filtered.length > 0) {
          const splitExercises = filtered.map((exId, idx) => ({
            user_id: user.id,
            split_id: (inserted as { id: string }).id,
            exercise_id: exId,
            order_index: idx,
          }));
          await supabase.from("split_exercises").insert(splitExercises);
          totalExercises += filtered.length;
        }
      }
    }

    return NextResponse.json({
      message: `Plano de treino criado! ${splits.length} dias configurados com ${totalExercises} exercícios na aba Treino.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ message: `Erro ao gerar: ${msg}` }, { status: 500 });
  }
}
