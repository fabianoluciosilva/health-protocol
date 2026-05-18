export function formatDateISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function dayOfWeekBR(d: Date): number {
  return d.getDay() + 1; // 1=Dom, 2=Seg ... 7=Sab
}

export function dayNameBR(d: Date): string {
  return ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][d.getDay()];
}

export function dayShortBR(idx: number): string {
  return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][(idx - 1) % 7];
}

export function dateLabelBR(d: Date): string {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function greetingBR(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function timeUntilLabel(now: Date, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diffMin = Math.round((target.getTime() - now.getTime()) / 60_000);
  if (diffMin < -30) return "Atrasado";
  if (diffMin <= 0) return "Agora";
  const hh = Math.floor(diffMin / 60);
  const mm = diffMin % 60;
  if (hh === 0) return `em ${mm}min`;
  return `em ${hh}h${String(mm).padStart(2, "0")}`;
}
