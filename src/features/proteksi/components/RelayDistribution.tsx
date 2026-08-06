import { ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import type { ProtectionRecord } from "../types";

export function RelayDistribution({
  records,
}: {
  records: ProtectionRecord[];
}) {
  const segments = useMemo(() => {
    const lcd = records.filter(
      (record) => record.relayTypeNormalized.includes("LCD"),
    ).length;
    const distance = records.filter((record) =>
      record.relayTypeNormalized.includes("DISTANCE"),
    ).length;

    return [
      { label: "LCD", count: lcd, color: "#2c7be5" },
      { label: "Distance", count: distance, color: "#94a3b8" },
      {
        label: "Lainnya",
        count: Math.max(records.length - lcd - distance, 0),
        color: "#f9a825",
      },
    ];
  }, [records]);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <article className="panel proteksi-panel">
      <div className="proteksi-panel-head">
        <span>
          <strong>Distribusi Jenis Relai</strong>
          <small>Komposisi bay berdasarkan jenis relai MPU</small>
        </span>
        <ShieldCheck size={17} />
      </div>

      <div className="proteksi-donut-layout">
        <div className="proteksi-donut">
          <svg viewBox="0 0 110 110" role="img" aria-label="Distribusi relai">
            <circle className="proteksi-donut-base" cx="55" cy="55" r={radius} />
            {segments.map((segment) => {
              const length =
                records.length > 0
                  ? (segment.count / records.length) * circumference
                  : 0;
              const currentOffset = offset;
              offset += length;

              return (
                <circle
                  key={segment.label}
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="13"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-currentOffset}
                  strokeLinecap="butt"
                  transform="rotate(-90 55 55)"
                />
              );
            })}
          </svg>
          <span>
            <strong>{records.length}</strong>
            <small>bay</small>
          </span>
        </div>

        <div className="proteksi-legend">
          {segments.map((segment) => (
            <div key={segment.label}>
              <i style={{ background: segment.color }} />
              <span>{segment.label}</span>
              <b>{segment.count}</b>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
