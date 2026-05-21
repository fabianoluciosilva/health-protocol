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

type RawResult = {
  marker: string;
  value: number;
  unit: string;
  ref_min: number | null;
  ref_max: number | null;
  category: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada." }, { status: 500 });
  }

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Erro ao processar o arquivo." }, { status: 400 });
  }

  const examDate = (formData.get("exam_date") as string)?.trim();
  const labName = (formData.get("lab_name") as string)?.trim() || null;
  const file = formData.get("file") as File | null;

  if (!examDate || !file) {
    return NextResponse.json({ error: "Data do exame e arquivo são obrigatórios." }, { status: 400 });
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

  const prompt = `Você está analisando um resultado de exame laboratorial. Extraia TODOS os marcadores presentes no documento.

Para cada marcador, identifique:
- marker: nome do exame (ex: "Glicose", "Hemoglobina", "TSH", "Colesterol Total")
- value: valor numérico do resultado (apenas o número)
- unit: unidade de medida (ex: "mg/dL", "g/dL", "mU/L", "%")
- ref_min: valor mínimo da faixa de referência (null se não informado)
- ref_max: valor máximo da faixa de referência (null se não informado)
- category: classifique em uma das categorias: "metabolic" (glicose, insulina, HOMA), "lipid" (colesterol, LDL, HDL, triglicerídeos), "hepatic" (TGO, TGP, GGT, fosfatase, bilirrubina), "renal" (creatinina, ureia, ácido úrico), "hormonal" (TSH, T3, T4, testosterona, cortisol, PSA, DHEA), "blood" (hemograma, leucócitos, plaquetas), "inflammatory" (PCR, VHS, ferritina), "vitamin" (vitaminas, minerais, ferro), "outros"

Use a ferramenta save_lab_results com todos os marcadores encontrados.`;

  let response;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createParams: any = {
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [
        {
          name: "save_lab_results",
          description: "Salva os marcadores extraídos do exame laboratorial",
          input_schema: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    marker: { type: "string" },
                    value: { type: "number" },
                    unit: { type: "string" },
                    ref_min: { type: ["number", "null"] },
                    ref_max: { type: ["number", "null"] },
                    category: { type: "string" },
                  },
                  required: ["marker", "value", "unit", "ref_min", "ref_max", "category"],
                },
              },
            },
            required: ["results"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "save_lab_results" },
      messages: [
        {
          role: "user",
          content: [contentBlock, { type: "text", text: prompt }],
        },
      ],
    };

    if (mediaType === "application/pdf") {
      response = await anthropic.beta.messages.create({
        ...createParams,
        betas: ["pdfs-2024-09-25"],
      });
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

  const { results } = toolBlock.input as { results: RawResult[] };
  if (!results?.length) {
    return NextResponse.json({ error: "Nenhum marcador encontrado no documento." }, { status: 422 });
  }

  const admin = adminClient();

  // Create exam record
  const { data: examData, error: examErr } = await admin
    .from("lab_exams")
    .insert({ exam_date: examDate, lab_name: labName, user_id: user.id })
    .select()
    .single();

  if (examErr || !examData) {
    return NextResponse.json({ error: "Erro ao salvar o exame: " + examErr?.message }, { status: 500 });
  }

  // Insert results
  const rows = results.map((r) => ({
    exam_id: examData.id,
    user_id: user.id,
    marker: r.marker,
    value: r.value,
    unit: r.unit || "",
    ref_min: r.ref_min ?? null,
    ref_max: r.ref_max ?? null,
    category: r.category || "outros",
  }));

  const { error: resErr } = await admin.from("lab_results").insert(rows);
  if (resErr) {
    await admin.from("lab_exams").delete().eq("id", examData.id);
    return NextResponse.json({ error: "Erro ao salvar resultados: " + resErr.message }, { status: 500 });
  }

  return NextResponse.json({
    examId: examData.id,
    examDate,
    labName,
    markerCount: results.length,
  });
}
