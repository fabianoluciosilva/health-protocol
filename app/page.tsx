import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_done")
    .maybeSingle();

  if (profile && profile.onboarding_done === false) {
    redirect("/onboarding");
  }

  redirect("/medications");
}
