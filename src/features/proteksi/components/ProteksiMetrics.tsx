import { percentage } from "../utils/domain";
import type { MetricTone, ProteksiMetrics } from "../types";

type MetricCardProps = {
  label: string;
  value: number;
  detail: string;
  tone: MetricTone;
};

function MetricCard({
  label,
  value,
  detail,
  tone,
}: MetricCardProps) {
  return (
    <article className={`proteksi-metric proteksi-tone-${tone}`}>
      <span>{label}</span>
      <strong>{value.toLocaleString("id-ID")}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function ProteksiMetrics({
  metrics,
}: {
  metrics: ProteksiMetrics;
}) {
  return (
    <div className="proteksi-metrics">
      <MetricCard
        label="Total Bay"
        value={metrics.total}
        detail="sesuai filter"
        tone="blue"
      />
      <MetricCard
        label="Bay LCD"
        value={metrics.lcd}
        detail={`${percentage(metrics.lcd, metrics.total)}% dari total`}
        tone="blue"
      />
      <MetricCard
        label="LCD Kritikal"
        value={metrics.critical}
        detail={`${percentage(metrics.critical, metrics.lcd)}% dari LCD`}
        tone="amber"
      />
      <MetricCard
        label="FO Fail → Ann."
        value={metrics.ja}
        detail={`${percentage(metrics.ja, metrics.lcd)}% selesai`}
        tone="green"
      />
      <MetricCard
        label="Diff → Ann."
        value={metrics.jb}
        detail={`${percentage(metrics.jb, metrics.lcd)}% selesai`}
        tone="red"
      />
      <MetricCard
        label="FO Fail → Dash/EWS"
        value={metrics.jd}
        detail={`${percentage(metrics.jd, metrics.lcd)}% selesai`}
        tone="green"
      />
      <MetricCard
        label="Diff → Dash/EWS"
        value={metrics.je}
        detail={`${percentage(metrics.je, metrics.lcd)}% selesai`}
        tone="violet"
      />
      <MetricCard
        label="Skor Lengkap"
        value={metrics.score4}
        detail={`${percentage(metrics.score4, metrics.lcd)}% skor 4`}
        tone="cyan"
      />
    </div>
  );
}
