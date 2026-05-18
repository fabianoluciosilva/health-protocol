"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, Lightbulb } from "lucide-react";
import type { SplitExercise } from "@/lib/supabase/types";
import VideoPlayer from "./VideoPlayer";
import { useLastWeight } from "@/hooks/useExerciseLog";
import { getWeightRecommendation } from "@/lib/utils/workout";
import { cn } from "@/lib/utils/cn";

interface Props {
  splitExercise: SplitExercise;
  index: number;
  bodyWeightKg?: number;
  isCompleted?: boolean;
  isActive?: boolean;
  onStart?: () => void;
}

export default function ExerciseCard({
  splitExercise,
  index,
  bodyWeightKg = 130,
  isCompleted = false,
  isActive = false,
  onStart,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const exercise = splitExercise.exercise!;
  const lastWeight = useLastWeight(exercise.id);
  const suggestion = getWeightRecommendation(exercise.name, bodyWeightKg);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-bg-card transition-all",
        isCompleted && "border-accent-green/40 opacity-60",
        isActive && "border-accent-blue/60 ring-1 ring-accent-blue/20",
        !isCompleted && !isActive && "border-bg-elevated"
      )}
    >
      <button
        className="flex w-full items-center gap-3 p-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            isCompleted ? "bg-accent-green/20 text-accent-green" : "bg-bg-elevated text-gray-400"
          )}
        >
          {isCompleted ? "✓" : index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className={cn("truncate text-sm font-semibold", isCompleted ? "text-gray-400 line-through" : "text-white")}>
            {exercise.name}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500">
            <span>{exercise.sets} séries · {exercise.reps} reps</span>
            <span>·</span>
            <Clock className="h-3 w-3" />
            <span>{exercise.rest_seconds}s</span>
          </div>
        </div>

        <div className="shrink-0 text-gray-500">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-bg-elevated px-3 pb-3 pt-3">
          {lastWeight != null && (
            <div className="text-xs text-gray-400">
              Último peso registrado: <span className="font-semibold text-white">{lastWeight} kg</span>
            </div>
          )}
          {lastWeight == null && (
            <div className="text-xs text-gray-500">{suggestion}</div>
          )}

          {exercise.technique_tip && (
            <div className="flex items-start gap-2 rounded-xl bg-bg-elevated p-2.5 text-xs text-gray-300">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-yellow" />
              {exercise.technique_tip}
            </div>
          )}

          {exercise.youtube_video_id && (
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-gray-500">Como fazer</div>
              <VideoPlayer
                videoId={exercise.youtube_video_id}
                channel={exercise.youtube_channel}
                title={exercise.name}
              />
            </div>
          )}

          {!exercise.youtube_video_id && (
            <div className="rounded-xl bg-bg-elevated px-3 py-2.5 text-xs text-gray-500">
              ▶ Vídeo em breve — {exercise.youtube_channel}
            </div>
          )}

          {onStart && !isCompleted && (
            <button
              onClick={onStart}
              className="w-full rounded-xl bg-accent-blue py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
            >
              Iniciar este exercício
            </button>
          )}
        </div>
      )}
    </div>
  );
}
