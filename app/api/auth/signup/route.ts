import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, birth_date, weight_kg, height_cm, wake_time, sleep_time } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Dados obrigatórios ausentes." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Configuração do servidor ausente (env vars)." },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Cria o usuário com email já confirmado (sem precisar de confirmação por e-mail)
    const { data: userData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json({ error: "Auth: " + authError.message }, { status: 400 });
    }

    const userId = userData.user.id;

    // Cria o perfil usando service role (bypassa RLS)
    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      name: name.trim(),
      birth_date,
      weight_kg: parseFloat(weight_kg),
      height_cm: parseFloat(height_cm),
      wake_time: wake_time.length === 5 ? wake_time + ":00" : wake_time,
      sleep_time: sleep_time.length === 5 ? sleep_time + ":00" : sleep_time,
      onboarding_done: false,
      ai_nutrition_generated: false,
      ai_workout_generated: false,
      diet_renewal_months: 1,
      workout_renewal_months: 1,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Perfil: " + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: "Servidor: " + msg }, { status: 500 });
  }
}
