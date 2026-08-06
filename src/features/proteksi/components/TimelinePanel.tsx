import type { CSSProperties } from "react";
import type { TimelinePoint } from "../types";

type TimelinePanelProps = {
  title: string;
  subtitle: string;
  points: TimelinePoint[];
  firstLabel: string;
  secondLabel: string;
};

export function TimelinePanel({
  title,
  subtitle,
  points,
  firstLabel,
  secondLabel,
}: TimelinePanelProps) {
  const maxValue = Math.max(
    1,
    ...points.map((point) => point.first + point.second),
  );

  return (
    <article className="panel proteksi-panel proteksi-timeline-panel">
      <div className="proteksi-panel-head">
        <span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
      </div>

      {points.length === 0 ? (
        <p className="proteksi-empty">
          Tanggal realisasi belum tersedia.
        </p>
      ) : (
        <>
          <div className="proteksi-timeline-scroll">
            <div
              className="proteksi-timeline"
              style={{
                "--timeline-columns": points.length,
              } as CSSProperties}
            >
              {points.map((point) => {
                const firstHeight =
                  (point.first / maxValue) * 100;
                const secondHeight =
                  (point.second / maxValue) * 100;

                return (
                  <div className="proteksi-timeline-column" key={point.key}>
                    <div className="proteksi-timeline-values">
                      <small>
                        {point.first + point.second || ""}
                      </small>
                      <div>
                        {point.first > 0 && (
                          <i
                            className="is-actual"
                            style={{ height: `${firstHeight}%` }}
                            title={`${firstLabel}: ${point.first} bay`}
                          />
                        )}
                        {point.second > 0 && (
                          <i
                            className="is-target is-2026"
                            style={{ height: `${secondHeight}%` }}
                            title={`${secondLabel}: ${point.second} bay`}
                          />
                        )}
                      </div>
                    </div>
                    <b>{point.label}</b>
                    <span>
                      {point.cumulativeFirst}/
                      {point.cumulativeSecond}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="proteksi-timeline-legend">
            <span><i className="is-actual" />{firstLabel}</span>
            <span><i className="is-2026" />{secondLabel}</span>
            <small>Kumulatif: {firstLabel}/{secondLabel}</small>
          </div>
        </>
      )}
    </article>
  );
}
