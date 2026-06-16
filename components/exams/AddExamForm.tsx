"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Check, AlertTriangle, Sparkles, X } from "lucide-react";

interface Props {
  onSuccess: (examId?: string) => void;
}

export default function AddExamForm({ onSuccess }: Props) {
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [labName, setLabName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "extracting" | "done" | "error">("idle");
  const [result, setResult] = useState<{ markerCount: number; examDate: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file || !examDate) return;
    setStatus("extracting");
    setErrorMsg("");

    try {
      const fd = new FormData();
      fd.append("exam_date", examDate);
      fd.append("lab_name", labName);
      fd.append("file", file);

      const res = await fetch("/api/extract-exam", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Erro desconhecido.");
        setStatus("error");
        return;
      }

      setResult({ markerCount: data.markerCount, examDate: data.examDate });
      setStatus("done");
      setTimeout(() => onSuccess(data.examId), 1500);
    } catch {
      setErrorMsg("Falha na conexão. Tente novamente.");
      setStatus("error");
    }
  };

  if (status === "done" && result) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-center">
        <Check className="h-8 w-8 text-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-white">Exame importado com sucesso!</p>
          <p className="text-xs text-gray-400 mt-1">
            {result.markerCount} marcadores extraídos do exame de{" "}
            {new Date(result.examDate + "T12:00:00").toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl bg-bg-card p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent-purple" />
        <h2 className="text-sm font-semibold text-white">Importar exame com IA</h2>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        Faça upload do PDF ou foto do exame. A IA extrai automaticamente todos os marcadores, valores e faixas de referência.
      </p>

      {/* Date + Lab */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Data do exame</span>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-accent-blue"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">Laboratório</span>
          <input
            type="text"
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
            placeholder="Ex: Dasa, Fleury…"
            className="w-full rounded-xl bg-bg-elevated px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-accent-blue"
          />
        </label>
      </div>

      {/* File picker */}
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-600 px-4 py-3 active:scale-[0.98] transition-transform">
        <FileText className="h-5 w-5 shrink-0 text-accent-blue" />
        <div className="flex-1 min-w-0">
          {file ? (
            <div className="flex items-center gap-2">
              <span className="truncate text-sm text-white">{file.name}</span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="shrink-0 text-gray-500 active:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Selecionar PDF ou imagem do exame</span>
          )}
        </div>
        <Upload className="h-4 w-4 shrink-0 text-gray-500" />
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {status === "error" && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <p className="text-xs text-red-300">{errorMsg}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file || !examDate || status === "extracting"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-purple py-3 text-sm font-semibold text-white disabled:opacity-40 active:scale-[0.98] transition-transform"
      >
        {status === "extracting" ? (
          <>
            <Sparkles className="h-4 w-4 animate-pulse" />
            Extraindo marcadores…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Extrair com IA
          </>
        )}
      </button>

      {status === "extracting" && (
        <p className="text-center text-[11px] text-gray-500">
          A IA está lendo o exame. Pode levar até 30 segundos para um documento completo.
        </p>
      )}
    </div>
  );
}
