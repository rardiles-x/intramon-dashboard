import { UPT_COLORS } from "../config";
import { percentage } from "../utils/domain";
import type { CompletionKey, UptSummary } from "../types";

type UptProgressPanelProps = {
  title: string;
  subtitle: string;
  summaries: UptSummary[];
  firstKey: CompletionKey;
  secondKey: CompletionKey;
  firstLabel: string;
  secondLabel: string;
};

export function UptProgressPanel({
  title,
  subtitle,
  summaries,
  firstKey,
  secondKey,
  firstLabel,
  secondLabel,
}: UptProgressPanelProps) {
  return (
    <article className="panel proteksi-panel proteksi-upt-panel">
      <div className="proteksi-panel-head">
        <span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
      </div>

      <div className="proteksi-upt-list">
        {summaries.length === 0 ? (
          <p className="proteksi-empty">Tidak ada data UPT.</p>
        ) : (
          summaries.map((summary) => {
            const firstPercent = percentage(
              summary[firstKey],
              summary.total,
            );
            const secondPercent = percentage(
              summary[secondKey],
              summary.total,
            );

            return (
              <div className="proteksi-upt-row" key={summary.upt}>
                <div className="proteksi-upt-label">
                  <i
                    style={{
                      background:
                        UPT_COLORS[summary.upt] ?? "var(--muted)",
                    }}
                  />
                  <span>{summary.upt}</span>
                  <small>{summary.total} bay</small>
                </div>

                <div className="proteksi-upt-bars">
                  <div>
                    <span>{firstLabel}</span>
                    <div className="proteksi-upt-track">
                      <i
                        className="is-first"
                        style={{ width: `${firstPercent}%` }}
                      />
                    </div>
                    <b>{summary[firstKey]}/{summary.total}</b>
                  </div>
                  <div>
                    <span>{secondLabel}</span>
                    <div className="proteksi-upt-track">
                      <i
                        className="is-second"
                        style={{ width: `${secondPercent}%` }}
                      />
                    </div>
                    <b>{summary[secondKey]}/{summary.total}</b>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}
