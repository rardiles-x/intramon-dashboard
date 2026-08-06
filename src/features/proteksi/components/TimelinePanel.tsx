import type { CSSProperties } from "react";
import type { TimelinePoint } from "../types";

type TimelinePanelProps = {
  title: string;
  subtitle: string;
  points: TimelinePoint[];
  targetLabel: string;
  firstLabel: string;
  secondLabel: string;
};

export function TimelinePanel({
  title,
  subtitle,
  points,
  targetLabel,
  firstLabel,
  secondLabel,
}: TimelinePanelProps) {
  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [
      point.target,
      point.first,
      point.second,
    ]),
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
          Target dan tanggal realisasi belum tersedia.
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
                const targetHeight =
                  (point.target / maxValue) * 100;
                const firstHeight =
                  (point.first / maxValue) * 100;
                const secondHeight =
                  (point.second / maxValue) * 100;

                return (
                  <div className="proteksi-timeline-column" key={point.key}>
                    <div className="proteksi-timeline-values">
                      <small
                        title={[
                          `${targetLabel}: ${point.target}`,
                          `${firstLabel}: ${point.first}`,
                          `${secondLabel}: ${point.second}`,
                        ].join(" · ")}
                      >
                        {point.target}/{point.first}/{point.second}
                      </small>
                      <div>
                        {point.target > 0 && (
                          <i
                            className="is-plan"
                            style={{ height: `${targetHeight}%` }}
                            title={`${targetLabel}: ${point.target} bay`}
                          />
                        )}
                        {point.first > 0 && (
                          <i
                            className="is-first"
                            style={{ height: `${firstHeight}%` }}
                            title={`${firstLabel}: ${point.first} bay`}
                          />
                        )}
                        {point.second > 0 && (
                          <i
                            className="is-second"
                            style={{ height: `${secondHeight}%` }}
                            title={`${secondLabel}: ${point.second} bay`}
                          />
                        )}
                      </div>
                    </div>
                    <b>{point.label}</b>
                    <span
                      title={[
                        `Kumulatif ${targetLabel}: ${point.cumulativeTarget}`,
                        `Kumulatif ${firstLabel}: ${point.cumulativeFirst}`,
                        `Kumulatif ${secondLabel}: ${point.cumulativeSecond}`,
                      ].join(" · ")}
                    >
                      {point.cumulativeTarget}/
                      {point.cumulativeFirst}/
                      {point.cumulativeSecond}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="proteksi-timeline-legend">
            <span><i className="is-plan" />{targetLabel}</span>
            <span><i className="is-first" />{firstLabel}</span>
            <span><i className="is-second" />{secondLabel}</span>
            <small>
              Kumulatif: target/FO Fail/Diff Alarm-Spv
            </small>
          </div>
        </>
      )}
    </article>
  );
}
