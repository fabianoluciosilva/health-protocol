"use client";

import { useState } from "react";
import { Heart, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useBloodPressure, getBPCategory, BP_META } from "@/hooks/useBloodPressure";
import { cn } from "@/lib/utils/cn";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmtDate(iso: string) {
  const [y, m, dd] = iso.split("-").map(Number);
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${dd} ${months[m - 1]} ${y}`;
}

export default function BloodPressureCard() {
  const { logs, loading, addReading, removeReading } = useBloodPressure(10);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTime());

  const handleSave = async () => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    if (!sys || !dia || sys < 60 || sys > 250 || dia < 40 || dia > 150) return;
    setSaving(true);
    await addReading(sys, dia, pulse ? parseInt(pulse) : null, date, time + ":00");
    setSystolic(""); setDiastolic(""); setPulse("");
    setDate(todayStr()); setTime(nowTime());
    setShowForm(false);
    setSaving(false);
  };

  const visible = showAll ? logs : logs.slice(0, 3);

  return (
    <div className="rounded-2xl bg-bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-400" />
          <span className="text-sm font-semibold text-white">Pressão Arterial</span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-xl bg-bg-elevated px-3 py-1.5 text-xs font-medium text-gray-300 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Registrar
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border-t border-bg-elevated px-4 pb-4 pt-3 space-y-3">
          <div className="flex gap-3 items-end">
            {/* Systolic / Diastolic */}
            <div className="flex-1">
              <label className="mb-1 block text-[11px] text-gray-500">Sistólica / Diastólica</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="120"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
                  min={60} max={250}
                />
                <span className="text-gray-500 font-bold">/</span>
                <input
                  type="number"
                  placeholder="80"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
                  min={40} max={150}
                />
              </div>
            </div>
            {/* Pulse */}
            <div className="w-20">
              <label className="mb-1 block text-[11px] text-gray-500">Pulso</label>
              <input
                type="number"
                placeholder="72"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
                min={30} max={200}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] text-gray-500">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-accent-blue"
              />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-[11px] text-gray-500">Hora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-accent-blue"
              />
            </div>
          </div>

          {systolic && diastolic && (
            <div className={cn(
              "rounded-xl px-3 py-2 text-xs font-medium",
              BP_META[getBPCategory(+systolic, +diastolic)].color
            )}>
              {BP_META[getBPCategory(+systolic, +diastolic)].dot}{" "}
              {BP_META[getBPCategory(+systolic, +diastolic)].label}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !systolic || !diastolic}
            className="w-full rounded-xl bg-accent-blue py-2.5 text-sm font-semibold text-white disabled:opacity-40 active:scale-[0.98]"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      )}

      {/* Readings list */}
      {!loading && logs.length > 0 && (
        <div className="border-t border-bg-elevated divide-y divide-bg-elevated">
          {visible.map((log) => {
            const cat = getBPCategory(log.systolic, log.diastolic);
            const meta = BP_META[cat];
            return (
              <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-base">{meta.dot}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-white">
                      {log.systolic}/{log.diastolic}
                    </span>
                    <span className="text-xs text-gray-500">mmHg</span>
                    {log.pulse && (
                      <span className="text-xs text-gray-500">· {log.pulse} bpm</span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {fmtDate(log.log_date)} · {log.log_time.slice(0, 5)}
                    <span className={cn("ml-2 font-medium", meta.color)}>{meta.label}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeReading(log.id)}
                  className="rounded-lg p-1.5 text-gray-600 active:bg-bg-elevated"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {logs.length > 3 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="flex w-full items-center justify-center gap-1 py-2.5 text-xs text-gray-500 active:bg-bg-elevated"
            >
              {showAll ? (
                <><ChevronUp className="h-3.5 w-3.5" /> Ver menos</>
              ) : (
                <><ChevronDown className="h-3.5 w-3.5" /> Ver todos ({logs.length})</>
              )}
            </button>
          )}
        </div>
      )}

      {!loading && logs.length === 0 && (
        <div className="border-t border-bg-elevated px-4 py-4 text-center text-xs text-gray-500">
          Nenhuma leitura registrada ainda.
        </div>
      )}
    </div>
  );
}
