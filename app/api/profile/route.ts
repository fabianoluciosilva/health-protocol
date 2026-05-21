import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = adminClient();

  // Try to find profile
  const { data: existing } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return NextResponse.json(existing);

  // No profile — create one with sensible defaults
  const { data: created, error } = await admin
    .from("profiles")
    .upsert({
      id: user.id,
      name: user.email?.split("@")[0] ?? "Usuário",
      birth_date: "1990-01-01",
      weight_kg: 80,
      height_cm: 170,
      wake_time: "07:00:00",
      sleep_time: "23:00:00",
      onboarding_done: false,
      ai_nutrition_generated: false,
      ai_workout_generated: false,
      diet_renewal_months: 1,
      workout_renewal_months: 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(created);
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patch = await req.json();
  const admin = adminClient();

  const { data, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
