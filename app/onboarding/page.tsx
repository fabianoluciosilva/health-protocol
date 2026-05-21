"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Sparkles, Check } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils/cn";

// ─── tipos ───────────────────────────────────────────────────────────────────

type Goal = "perda_de_peso" | "ganho_de_massa" | "manutencao" | "condicionamento";
type Experience = "iniciante" | "intermediario" | "avancado";
type Equipment = "academia" | "casa" | "ambos";

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Pill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors active:scale-[0.97]",
        active ? "bg-accent-blue text-white" : "bg-bg-elevated text-gray-400"
      )}
    >
      {label}
    </button>
  );
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === current ? "w-6 bg-accent-blue" : i < current ? "w-1.5 bg-accent-blue/40" : "w-1.5 bg-bg-elevated"
          )}
        />
      ))}
    </div>
  );
}

// ─── steps ───────────────────────────────────────────────────────────────────

const HEALTH_CHIPS = [
  "Hipertensão", "Diabetes tipo 2", "Hiperuricemia (gota)",
  "Colesterol alto", "Hipotireoidismo", "Obesidade",
  "Refluxo / gastrite", "Apneia do sono",
];

// ─── main ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, update } = useProfile();

  // step index 0-4  (4 = geração final)
  const [step, setStep] = useState(0);
  const [genStatus, setGenStatus] = useState<"idle" | "nutrition" | "workout" | "done" | "error">("idle");
  const [genMsg, setGenMsg] = useState("");

  // ── step 1 ──
  const [name, setName] = useState(profile?.name ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? "1990-01-01");
  const [weight, setWeight] = useState(String(profile?.weight_kg ?? ""));
  const [height, setHeight] = useState(String(profile?.height_cm ?? ""));

  // ── step 2 ──
  const [wake, setWake] = useState(profile?.wake_time?.slice(0, 5) ?? "07:00");
  const [sleep, setSleep] = useState(profile?.sleep_time?.slice(0, 5) ?? "23:00");
  const [goal, setGoal] = useState<Goal>((profile?.fitness_goal as Goal) ?? "perda_de_peso");
  const [trainingDays, setTrainingDays] = useState(profile?.training_days_per_week ?? 4);

  // ── step 3 ──
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [otherConditions, setOtherConditions] = useState("");
  const [foodRestrictions, setFoodRestrictions] = useState(profile?.food_restrictions ?? "");

  // ── step 4 ──
  const [experience, setExperience] = useState<Experience>((profile?.training_experience as Experience) ?? "iniciante");
  const [equipment, setEquipment] = useState<Equipment>((profile?.available_equipment as Equipment) ?? "academia");
  const [mobilityRestrictions, setMobilityRestrictions] = useState(profile?.mobility_restrictions ?? "");

  // ─── navigation ─────────────────────────────────────────────────────────────

  const canAdvance = [
    name.trim() && weight && height && birthDate,
    true,
    true,
    true,
  ][step];

  const handleNext = () => {
    if (step < 4) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  // ─── final: save + generate ───────────────────────────────────────────────

  const handleGenerate = async () => {
    // Build patch
    const allConditions = [
      ...Array.from(selectedChips),
      ...(otherConditions.trim() ? [otherConditions.trim()] : []),
    ].join(", ");

    const patch = {
      name: name.trim(),
      birth_date: birthDate,
      weight_kg: Number(weight),
      height_cm: Number(height),
      wake_time: wake.length === 5 ? wake + ":00" : wake,
      sleep_time: sleep.length === 5 ? sleep + ":00" : sleep,
      fitness_goal: goal,
      training_days_per_week: trainingDays,
      health_conditions: allConditions || null,
      food_restrictions: foodRestrictions.trim() || null,
      training_experience: experience,
      available_equipment: equipment,
      mobility_restrictions: mobilityRestrictions.trim() || null,
      onboarding_done: true,
    };

    await update(patch);

    // Fetch fresh profile for AI
    const profileRes = await fetch("/api/profile");
    const freshProfile = profileRes.ok ? await profileRes.json() : { ...profile, ...patch };

    // Generate nutrition
    setGenStatus("nutrition");
    setGenMsg("Gerando seu plano alimentar personalizado…");
    try {
      const nutRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: freshProfile, type: "nutrition" }),
      });
      if (!nutRes.ok) {
        const err = await nutRes.json();
        throw new Error(err.message);
      }
    } catch (e) {
      setGenMsg("Erro no cardápio: " + (e instanceof Error ? e.message : "tente novamente no perfil"));
    }

    // Generate workout
    setGenStatus("workout");
    setGenMsg("Gerando sua série de treinos…");
    try {
      const wrkRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: freshProfile, type: "workout" }),
      });
      if (!wrkRes.ok) {
        const err = await wrkRes.json();
        throw new Error(err.message);
      }
    } catch (e) {
      setGenMsg("Erro no treino: " + (e instanceof Error ? e.message : "tente novamente no perfil"));
    }

    setGenStatus("done");
    setGenMsg("Planos prontos! Bem-vindo ao seu protocolo de saúde.");
  };

  const handleFinish = () => {
    router.push("/medications");
    router.refresh();
  };

  // ─── render ──────────────────────────────────────────────────────────────

  const inputCls = "w-full rounded-xl bg-bg-elevated px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue";

  const STEPS = ["Dados pessoais", "Rotina e objetivo", "Saúde e alimentação", "Treino"];

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-8 pt-10">
      {/* Header */}
      {step < 4 && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            {step > 0 ? (
              <button onClick={handleBack} className="flex items-center gap-1 text-xs text-gray-500 active:text-white">
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
            ) : (
              <div />
            )}
            <span className="text-xs text-gray-500">{step + 1} / {STEPS.length}</span>
          </div>
          <StepDots total={STEPS.length} current={step} />
          <h1 className="text-xl font-bold text-white">{STEPS[step]}</h1>
        </div>
      )}

      {/* ── Step 0: Dados pessoais ─────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4 flex-1">
          <label className="block space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Nome completo</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Como gostaria de ser chamado?" className={inputCls} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Data de nascimento</span>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputCls} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Peso (kg)</span>
              <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)}
                placeholder="Ex: 95" className={inputCls} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Altura (cm)</span>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                placeholder="Ex: 178" className={inputCls} />
            </label>
          </div>
        </div>
      )}

      {/* ── Step 1: Rotina e objetivo ─────────────────────── */}
      {step === 1 && (
        <div className="space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Acorda</span>
              <input type="time" value={wake} onChange={(e) => setWake(e.target.value)} className={inputCls} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Dorme</span>
              <input type="time" value={sleep} onChange={(e) => setSleep(e.target.value)} className={inputCls} />
            </label>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Objetivo principal</span>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["perda_de_peso", "🔥 Perder peso"],
                ["ganho_de_massa", "💪 Ganhar massa"],
                ["manutencao", "⚖️ Manutenção"],
                ["condicionamento", "🏃 Condicionamento"],
              ] as [Goal, string][]).map(([v, label]) => (
                <Pill key={v} label={label} active={goal === v} onClick={() => setGoal(v)} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Dias disponíveis para treinar por semana
            </span>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTrainingDays(n)}
                  className={cn(
                    "flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors",
                    trainingDays === n ? "bg-accent-blue text-white" : "bg-bg-elevated text-gray-400"
                  )}
                >
                  {n}×
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Saúde e alimentação ───────────────────── */}
      {step === 2 && (
        <div className="space-y-5 flex-1">
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Condições de saúde (selecione as que se aplicam)
            </span>
            <div className="flex flex-wrap gap-2">
              {HEALTH_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSelectedChips((prev) => {
                    const next = new Set(prev);
                    next.has(chip) ? next.delete(chip) : next.add(chip);
                    return next;
                  })}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
                    selectedChips.has(chip) ? "bg-accent-blue text-white" : "bg-bg-elevated text-gray-400"
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={otherConditions}
              onChange={(e) => setOtherConditions(e.target.value)}
              placeholder="Outra condição (ex: hipotireoidismo, TDAH…)"
              className={inputCls}
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Restrições alimentares e alergias
            </span>
            <textarea
              value={foodRestrictions}
              onChange={(e) => setFoodRestrictions(e.target.value)}
              placeholder="Ex: intolerância à lactose, alergia a glúten, não come carne vermelha, vegetariano…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      )}

      {/* ── Step 3: Treino ────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5 flex-1">
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Experiência com musculação</span>
            <div className="space-y-2">
              {([
                ["iniciante", "🌱 Iniciante", "Menos de 1 ano de treino"],
                ["intermediario", "💪 Intermediário", "1 a 3 anos de treino"],
                ["avancado", "🔥 Avançado", "Mais de 3 anos de treino"],
              ] as [Experience, string, string][]).map(([v, label, desc]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setExperience(v)}
                  className={cn(
                    "w-full rounded-xl px-4 py-3 text-left transition-colors",
                    experience === v ? "bg-accent-blue" : "bg-bg-elevated"
                  )}
                >
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className={cn("text-xs", experience === v ? "text-blue-200" : "text-gray-500")}>{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Onde você treina</span>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["academia", "🏋️ Academia"],
                ["casa", "🏠 Em casa"],
                ["ambos", "🔀 Ambos"],
              ] as [Equipment, string][]).map(([v, label]) => (
                <Pill key={v} label={label} active={equipment === v} onClick={() => setEquipment(v)} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Lesões ou restrições de mobilidade
            </span>
            <textarea
              value={mobilityRestrictions}
              onChange={(e) => setMobilityRestrictions(e.target.value)}
              placeholder="Ex: dor no joelho direito, hérnia de disco L4-L5, cirurgia no ombro… (deixe em branco se nenhuma)"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      )}

      {/* ── Step 4: Geração ──────────────────────────────── */}
      {step === 4 && (
        <div className="flex flex-1 flex-col items-center justify-center space-y-6 text-center py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent-purple/10">
            {genStatus === "done" ? (
              <Check className="h-10 w-10 text-emerald-400" />
            ) : (
              <Sparkles className={cn("h-10 w-10 text-accent-purple", genStatus !== "idle" && "animate-pulse")} />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">
              {genStatus === "idle" && "Tudo pronto!"}
              {genStatus === "nutrition" && "Criando seu cardápio…"}
              {genStatus === "workout" && "Criando sua série…"}
              {genStatus === "done" && "Planos prontos! 🎉"}
              {genStatus === "error" && "Quase lá"}
            </h1>
            <p className="mt-2 text-sm text-gray-400 max-w-xs">
              {genStatus === "idle" && "Vamos gerar seu plano alimentar e série de treino personalizada com IA."}
              {(genStatus === "nutrition" || genStatus === "workout") && genMsg}
              {genStatus === "done" && "Seu cardápio e treino foram gerados. Você pode editá-los a qualquer momento."}
              {genStatus === "error" && genMsg}
            </p>
          </div>

          {genStatus === "idle" && (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 rounded-2xl bg-accent-purple px-8 py-3.5 text-sm font-semibold text-white active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" />
              Gerar meu plano com IA
            </button>
          )}

          {(genStatus === "nutrition" || genStatus === "workout") && (
            <div className="space-y-2 w-full max-w-xs">
              <div className="h-2 w-full rounded-full bg-bg-elevated overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-purple transition-all duration-500"
                  style={{ width: genStatus === "nutrition" ? "50%" : "90%" }}
                />
              </div>
              <p className="text-xs text-gray-500">{genMsg}</p>
            </div>
          )}

          {(genStatus === "done" || genStatus === "error") && (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 rounded-2xl bg-accent-blue px-8 py-3.5 text-sm font-semibold text-white active:scale-[0.98]"
            >
              Começar a usar
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Bottom CTA ──────────────────────────────────────── */}
      {step < 4 && (
        <div className="mt-6">
          <button
            onClick={handleNext}
            disabled={!canAdvance}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-blue py-3.5 text-sm font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
          >
            {step === 3 ? "Revisar e gerar" : "Próximo"}
            <ChevronRight className="h-4 w-4" />
          </button>
          {step === 0 && (
            <button
              type="button"
              onClick={async () => {
                await update({ onboarding_done: true });
                router.push("/medications");
              }}
              className="mt-3 w-full text-center text-xs text-gray-600 active:text-gray-400"
            >
              Pular e preencher depois
            </button>
          )}
        </div>
      )}
    </div>
  );
}
