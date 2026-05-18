interface Point {
  date: string;
  value: number;
  status: "low" | "high" | "normal";
}

interface Props {
  points: Point[];
  refMin: number | null;
  refMax: number | null;
}

const STATUS_COLOR: Record<string, string> = {
  normal: "#22c55e",
  high: "#f59e0b",
  low: "#60a5fa",
};

function fmtMonth(iso: string): string {
  const m = Number(iso.split("-")[1]);
  return ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][m - 1];
}

function fmtYear(iso: string): string {
  return iso.split("-")[0].slice(2);
}

export default function MarkerSparkline({ points, refMin, refMax }: Props) {
  if (points.length < 2) return null;

  const W = 300, H = 58;
  const padT = 10, padB = 18, padL = 6, padR = 6;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const n = points.length;

  const vals = points.map((p) => p.value);
  const allNums = [
    ...vals,
    ...(refMin != null ? [refMin] : []),
    ...(refMax != null ? [refMax] : []),
  ];
  const rawMin = Math.min(...allNums);
  const rawMax = Math.max(...allNums);
  const rawRange = rawMax - rawMin || 1;
  const vPad = rawRange * 0.4;
  const yMin = rawMin - vPad;
  const yMax = rawMax + vPad;
  const yRange = yMax - yMin;

  const toX = (i: number) =>
    padL + (n === 1 ? cW / 2 : (i / (n - 1)) * cW);
  const toY = (v: number) =>
    padT + cH - ((v - yMin) / yRange) * cH;

  const polyPts = points.map((p, i) => `${toX(i)},${toY(p.value)}`).join(" ");

  const bandTop = refMax != null ? toY(refMax) : padT;
  const bandBot = refMin != null ? toY(refMin) : padT + cH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 58 }}>
      {/* Reference band */}
      {(refMin != null || refMax != null) && (
        <rect
          x={padL}
          y={Math.min(bandTop, bandBot)}
          width={cW}
          height={Math.max(0, Math.abs(bandBot - bandTop))}
          fill="rgba(34,197,94,0.07)"
          stroke="rgba(34,197,94,0.2)"
          strokeWidth="0.5"
        />
      )}

      {/* Connecting line */}
      <polyline
        points={polyPts}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Dots, value labels, date labels */}
      {points.map((p, i) => {
        const cx = toX(i);
        const cy = toY(p.value);
        const color = STATUS_COLOR[p.status] ?? "#9ca3af";
        const label =
          p.value % 1 === 0
            ? String(p.value)
            : p.value.toFixed(1).replace(".", ",");
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="3.5" fill={color} />
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              fontSize="7.5"
              fill={color}
              fontWeight="700"
            >
              {label}
            </text>
            <text
              x={cx}
              y={H - 4}
              textAnchor="middle"
              fontSize="6"
              fill="rgba(156,163,175,0.7)"
            >
              {fmtMonth(p.date)}/{fmtYear(p.date)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
