import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { LabExam, LabResult } from "@/lib/supabase/types";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const latestOnly = url.searchParams.get("latest") === "1";

  const admin = adminClient();

  let examQuery = admin
    .from("lab_exams")
    .select("*")
    .eq("user_id", user.id)
    .order("exam_date", { ascending: false });

  if (latestOnly) examQuery = examQuery.limit(1);

  const { data: examsData, error: examErr } = await examQuery;
  if (examErr) return NextResponse.json({ error: examErr.message }, { status: 500 });

  const exams = (examsData ?? []) as LabExam[];
  if (!exams.length) return NextResponse.json({ exams: [], results: [] });

  const { data: resultsData, error: resErr } = await admin
    .from("lab_results")
    .select("*")
    .in(
      "exam_id",
      exams.map((e) => e.id)
    );

  if (resErr) return NextResponse.json({ error: resErr.message }, { status: 500 });

  return NextResponse.json({
    exams,
    results: (resultsData ?? []) as LabResult[],
  });
}
