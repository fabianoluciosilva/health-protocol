import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import type { LabExam, LabResult } from "@/lib/supabase/types";

export const maxDuration = 60;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function formatResults(results: LabResult[]): string {
  const byCategory = new Map<string, LabResult[]>();
  results.forEach((r) => {
    const cat = r.category ?? "outros";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(r);
  });

  let text = "";
  byCategory.forEach((rows, category) => {
    text += `\n### ${category.toUpperCase()}\n`;
    rows.forEach((r) => {
      const ref =
        r.ref_min != null && r.ref_max != null
          ? `ref: ${r.ref_min}–${r.ref_max} ${r.unit}`
          : "sem referência";
      const flag = r.status !== "normal" ? ` ⚠️ ${r.status.toUpperCase()}` : "";
      text += `- ${r.marker}: ${r.value} ${r.unit} (${ref})${flag}\n`;
    });
  });
  return text;
}

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

  const body = await req.json() as { examId?: string };
  const admin = adminClient();

  // Fetch all exams ordered newest first
  const { data: examsData } = await admin
    .from("lab_exams")
    .select("*")
    .order("exam_date", { ascending: false });

  const exams = (examsData ?? []) as LabExam[];
  if (!exams.length) {
    return NextResponse.json({ error: "Nenhum exame encontrado." }, { status: 404 });
  }

  const targetExam = body.examId
    ? (exams.find((e) => e.id === body.examId) ?? exams[0])
    : exams[0];

  const prevExam = exams.find((e) => e.id !== targetExam.id);

  // Fetch results
  const { data: curData } = await admin
    .from("lab_results")
    .select("*")
    .eq("exam_id", targetExam.id);
  const currentResults = (curData ?? []) as LabResult[];

  let prevResults: LabResult[] = [];
  if (prevExam) {
    const { data: prevData } = await admin
      .from("lab_results")
      .select("*")
      .eq("exam_id", prevExam.id);
    prevResults = (prevData ?? []) as LabResult[];
  }

  const currentText = formatResults(currentResults);
  const prevText = prevExam ? formatResults(prevResults) : null;

  const prompt = `Você é um assistente especializado em análise de exames laboratoriais. Analise os resultados e forneça uma avaliação clara em português brasileiro, voltada ao paciente (não ao médico).

EXAME ATUAL — Data: ${targetExam.exam_date}${targetExam.lab_name ? `, Laboratório: ${targetExam.lab_name}` : ""}
${currentText}
${prevText ? `\nEXAME ANTERIOR — Data: ${prevExam!.exam_date}\n${prevText}` : "\nNão há exame anterior para comparação."}

Use a ferramenta save_exam_analysis para retornar a análise estruturada. Seja objetivo, use linguagem simples mas precisa. Destaque o que é crítico e precisa de atenção médica vs o que é apenas para acompanhamento.`;

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    tools: [
      {
        name: "save_exam_analysis",
        description: "Salva a análise estruturada dos resultados dos exames laboratoriais",
        input_schema: {
          type: "object" as const,
          properties: {
            summary: {
              type: "string",
              description: "Resumo geral dos resultados em 2-3 frases diretas",
            },
            overall: {
              type: "string",
              enum: ["bom", "atencao", "critico"],
              description: "bom = maioria dentro da faixa; atencao = alterações leves/moderadas; critico = alterações significativas",
            },
            criticos: {
              type: "array",
              description: "Marcadores fora da faixa de referência",
              items: {
                type: "object",
                properties: {
                  marker: { type: "string" },
                  valor: { type: "number" },
                  unidade: { type: "string" },
                  status: { type: "string", enum: ["high", "low"] },
                  explicacao: {
                    type: "string",
                    description: "O que significa e por que merece atenção",
                  },
                },
                required: ["marker", "valor", "unidade", "status", "explicacao"],
              },
            },
            melhorou: {
              type: "array",
              description: "Marcadores que melhoraram em relação ao exame anterior (deixar vazio se não há exame anterior)",
              items: {
                type: "object",
                properties: {
                  marker: { type: "string" },
                  anterior: { type: "number" },
                  atual: { type: "number" },
                  unidade: { type: "string" },
                  comentario: { type: "string" },
                },
                required: ["marker", "anterior", "atual", "unidade", "comentario"],
              },
            },
            piorou: {
              type: "array",
              description: "Marcadores que pioraram em relação ao exame anterior (deixar vazio se não há exame anterior)",
              items: {
                type: "object",
                properties: {
                  marker: { type: "string" },
                  anterior: { type: "number" },
                  atual: { type: "number" },
                  unidade: { type: "string" },
                  comentario: { type: "string" },
                },
                required: ["marker", "anterior", "atual", "unidade", "comentario"],
              },
            },
            normais: {
              type: "array",
              description: "Nomes dos marcadores dentro da faixa normal",
              items: { type: "string" },
            },
            recomendacoes: {
              type: "array",
              description: "3 a 5 recomendações práticas baseadas nos achados",
              items: { type: "string" },
            },
          },
          required: [
            "summary",
            "overall",
            "criticos",
            "melhorou",
            "piorou",
            "normais",
            "recomendacoes",
          ],
        },
      },
    ],
    tool_choice: { type: "tool", name: "save_exam_analysis" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolBlock = response.content.find((b: { type: string }) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    return NextResponse.json({ error: "IA não retornou análise estruturada." }, { status: 500 });
  }

  const analysis = toolBlock.input;

  // Save to DB (gracefully handles if column doesn't exist yet)
  await admin.from("lab_exams").update({ ai_analysis: analysis }).eq("id", targetExam.id);

  return NextResponse.json({ examId: targetExam.id, analysis });
}
