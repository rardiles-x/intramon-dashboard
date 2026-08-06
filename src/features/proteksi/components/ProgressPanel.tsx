import { Target } from "lucide-react";
import type { ProgressItem } from "../types";

export function ProgressPanel({
  items,
  total,
}: {
  items: ProgressItem[];
  total: number;
}) {
  return (
    <article className="panel proteksi-panel proteksi-progress-panel">
      <div className="proteksi-panel-head">
        <span>
          <strong>Progress Penarikan Indikasi</strong>
          <small>Persentase bay LCD yang telah selesai</small>
        </span>
        <Target size={17} />
      </div>

      <div className="proteksi-progress-list">
        {items.map((item) => (
          <div className="proteksi-progress-item" key={item.key}>
            <div>
              <span>{item.label}</span>
              <b className={`proteksi-text-${item.tone}`}>
                {item.count}/{total} ({item.percent}%)
              </b>
            </div>
            <div className="proteksi-progress-track">
              <i
                className={`proteksi-fill-${item.tone}`}
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
