import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type Composition = {
  assessment_date: string | null;
  weight_kg: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  hips_cm: number | null;
  arm_cm: number | null;
  forearm_cm: number | null;
  thigh_cm: number | null;
  calf_cm: number | null;
  neck_cm: number | null;
  body_fat_pct: number | null;
  lean_mass_kg: number | null;
  fat_mass_kg: number | null;
  body_water_l: number | null;
  body_water_pct: number | null;
  rmr_kcal: number | null;
  waist_height_ratio: number | null;
  waist_hip_ratio: number | null;
  conicity_index: number | null;
  shaped_score: number | null;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada." }, { status: 500 });
  }

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Erro ao processar o arquivo." }, { status: 400 });
  }

  const fallbackDate = (formData.get("assessment_date") as string)?.trim() || null;
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Arquivo da avaliação é obrigatório." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mediaType = file.type.startsWith("image/")
    ? (file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
    : "application/pdf";

  const anthropic = new Anthropic({ apiKey });

  const contentBlock =
    mediaType === "application/pdf"
      ? ({
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
        })
      : ({
          type: "image" as const,
          source: { type: "base64" as const, media_type: mediaType, data: base64 },
        });

  const prompt = `Você está analisando um relatório de AVALIAÇÃO DE COMPOSIÇÃO CORPORAL (avaliação física, bioimpedância, antropometria ou Shaped).
Extraia os dados disponíveis. Use null para qualquer campo que não estiver presente no documento.

- assessment_date: data da avaliação no formato AAAA-MM-DD (procure por "Avaliação em")
- weight_kg: peso corporal em kg
- waist_cm: cintura | chest_cm: peito/tórax | hips_cm: quadril
- arm_cm: braço | forearm_cm: antebraço | thigh_cm: coxa | calf_cm: panturrilha | neck_cm: pescoço
- body_fat_pct: percentual de gordura (%)
- lean_mass_kg: massa magra (kg) | fat_mass_kg: massa gorda (kg)
- body_water_l: água corporal em litros | body_water_pct: água corporal em %
- rmr_kcal: gasto energético de repouso / taxa metabólica de repouso (kcal)
- waist_height_ratio: razão cintura-estatura | waist_hip_ratio: razão cintura/quadril
- conicity_index: índice de conicidade | shaped_score: Shaped Score (0 a 100)

Apenas números (sem unidades). Use a ferramenta save_body_composition.`;

  let response;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createParams: any = {
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      tools: [
        {
          name: "save_body_composition",
          description: "Salva os dados de composição corporal extraídos da avaliação",
          input_schema: {
            type: "object",
            properties: {
              assessment_date: { type: ["string", "null"] },
              weight_kg: { type: ["number", "null"] },
              waist_cm: { type: ["number", "null"] },
              chest_cm: { type: ["number", "null"] },
              hips_cm: { type: ["number", "null"] },
              arm_cm: { type: ["number", "null"] },
              forearm_cm: { type: ["number", "null"] },
              thigh_cm: { type: ["number", "null"] },
              calf_cm: { type: ["number", "null"] },
              neck_cm: { type: ["number", "null"] },
              body_fat_pct: { type: ["number", "null"] },
              lean_mass_kg: { type: ["number", "null"] },
              fat_mass_kg: { type: ["number", "null"] },
              body_water_l: { type: ["number", "null"] },
              body_water_pct: { type: ["number", "null"] },
              rmr_kcal: { type: ["number", "null"] },
              waist_height_ratio: { type: ["number", "null"] },
              waist_hip_ratio: { type: ["number", "null"] },
              conicity_index: { type: ["number", "null"] },
              shaped_score: { type: ["number", "null"] },
            },
            required: ["assessment_date"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "save_body_composition" },
      messages: [{ role: "user", content: [contentBlock, { type: "text", text: prompt }] }],
    };

    if (mediaType === "application/pdf") {
      response = await anthropic.beta.messages.create({ ...createParams, betas: ["pdfs-2024-09-25"] });
    } else {
      response = await anthropic.messages.create(createParams);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro na API da IA.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const toolBlock = response.content.find((b: { type: string }) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    return NextResponse.json({ error: "IA não retornou dados estruturados." }, { status: 500 });
  }

  const c = toolBlock.input as Composition;
  const logDate = (c.assessment_date || fallbackDate) ?? null;
  if (!logDate) {
    return NextResponse.json({ error: "Não foi possível identificar a data da avaliação." }, { status: 422 });
  }

  const admin = adminClient();

  // Upsert da avaliação (1 registro por data)
  const { error: upErr } = await admin.from("body_measurements").upsert(
    {
      user_id: user.id,
      log_date: logDate,
      waist_cm: c.waist_cm,
      chest_cm: c.chest_cm,
      hips_cm: c.hips_cm,
      arm_cm: c.arm_cm,
      forearm_cm: c.forearm_cm,
      thigh_cm: c.thigh_cm,
      calf_cm: c.calf_cm,
      neck_cm: c.neck_cm,
      body_fat_pct: c.body_fat_pct,
      lean_mass_kg: c.lean_mass_kg,
      fat_mass_kg: c.fat_mass_kg,
      body_water_l: c.body_water_l,
      body_water_pct: c.body_water_pct,
      rmr_kcal: c.rmr_kcal,
      waist_height_ratio: c.waist_height_ratio,
      waist_hip_ratio: c.waist_hip_ratio,
      conicity_index: c.conicity_index,
      shaped_score: c.shaped_score,
      source: "import",
    },
    { onConflict: "user_id,log_date" }
  );

  if (upErr) {
    return NextResponse.json({ error: "Erro ao salvar a avaliação: " + upErr.message }, { status: 500 });
  }

  // Registra o peso da avaliação para alimentar o informe e a evolução de peso
  if (c.weight_kg && c.weight_kg > 30 && c.weight_kg < 400) {
    await admin.from("body_weight_logs").upsert(
      { user_id: user.id, log_date: logDate, weight_kg: c.weight_kg },
      { onConflict: "log_date" }
    );
    // Mantém o peso do perfil alinhado ao registro mais recente
    const { data: latest } = await admin
      .from("body_weight_logs")
      .select("weight_kg")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(1);
    if (latest?.[0]) {
      await admin.from("profiles").update({ weight_kg: Number(latest[0].weight_kg) }).eq("id", user.id);
    }
  }

  return NextResponse.json({ logDate, weight: c.weight_kg ?? null });
}
