import {
  Clock3,
  Gauge,
  ListChecks,
} from "lucide-react";
import type {
  ThreeV0Metrics,
  ThreeV0MonthPoint,
  ThreeV0UptSummary,
} from "../types";
import { percentage } from "../utils";

export function ThreeV0MetricsGrid({
  metrics,
}: {
  metrics: ThreeV0Metrics;
}) {
  const cards = [
    {
      label: "Total Bay / Trafo",
      value: metrics.total,
      hint: "sesuai filter",
      tone: "blue",
    },
    {
      label: "Realisasi Analog",
      value: metrics.analogRealized,
      hint: `${percentage(
        metrics.analogRealized,
        metrics.total,
      )}%`,
      tone: "cyan",
    },
    {
      label: "Realisasi Alarm 3V0",
      value: metrics.alarmRealized,
      hint: `${percentage(
        metrics.alarmRealized,
        metrics.total,
      )}%`,
      tone: "green",
    },
    {
      label: "Selesai",
      value: metrics.complete,
      hint: "Analog Tegangan dan 3V0 Alarm lengkap",
      tone: "green",
    },
    {
      label: "Sebagian",
      value: metrics.partial,
      hint: "satu realisasi",
      tone: "amber",
    },
    {
      label: "Belum",
      value: metrics.pending,
      hint: `${metrics.progress}% progress`,
      tone: "red",
    },
  ] as const;

  return (
    <div className="proteksi-metrics threev0-metrics">
      {cards.map((card) => (
        <article
          className={
            `proteksi-metric ` +
            `proteksi-tone-${card.tone}`
          }
          key={card.label}
        >
          <span>{card.label}</span>
          <strong>
            {card.value.toLocaleString(
              "id-ID",
            )}
          </strong>
          <small>{card.hint}</small>
        </article>
      ))}
    </div>
  );
}

export function ThreeV0ProgressPanel({
  metrics,
}: {
  metrics: ThreeV0Metrics;
}) {
  const items = [
    {
      label:
        "Penarikan Analog Tegangan",
      count: metrics.analogRealized,
      percent: percentage(
        metrics.analogRealized,
        metrics.total,
      ),
      tone: "blue",
    },
    {
      label:
        "Aktivasi 3V0 untuk Alarm",
      count: metrics.alarmRealized,
      percent: percentage(
        metrics.alarmRealized,
        metrics.total,
      ),
      tone: "green",
    },
    {
      label:
        "Bay / Trafo selesai penuh",
      count: metrics.complete,
      percent: percentage(
        metrics.complete,
        metrics.total,
      ),
      tone: "violet",
    },
  ] as const;

  return (
    <article className="panel proteksi-panel">
      <div className="proteksi-panel-head">
        <span>
          <strong>
            Progress Implementasi 3V0
          </strong>
        </span>
        <ListChecks size={18} />
      </div>

      <div className="proteksi-progress-list">
        {items.map((item) => (
          <div
            className="proteksi-progress-item"
            key={item.label}
          >
            <div>
              <span>{item.label}</span>
              <b
                className={
                  `proteksi-text-${item.tone}`
                }
              >
                {item.count}/
                {metrics.total} ·{" "}
                {item.percent}%
              </b>
            </div>

            <div className="proteksi-progress-track">
              <i
                className={
                  `proteksi-fill-${item.tone}`
                }
                style={{
                  width: `${item.percent}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export function ThreeV0StatusDistribution({
  metrics,
}: {
  metrics: ThreeV0Metrics;
}) {
  const total = Math.max(
    metrics.total,
    1,
  );

  const completeEnd =
    (metrics.complete / total) * 100;

  const partialEnd =
    completeEnd +
    (metrics.partial / total) * 100;

  return (
    <article className="panel proteksi-panel">
      <div className="proteksi-panel-head">
        <span>
          <strong>
            Status Realisasi
          </strong>
        </span>
        <Gauge size={18} />
      </div>

      <div className="threev0-donut-layout">
        <div
          className="threev0-donut"
          style={{
            background:
              `conic-gradient(` +
              `#00d27a 0 ${completeEnd}%, ` +
              `#f9a825 ${completeEnd}% ${partialEnd}%, ` +
              `#e63757 ${partialEnd}% 100%)`,
          }}
        >
          <span>
            <strong>
              {metrics.progress}%
            </strong>
            <small>
              progress
            </small>
          </span>
        </div>

        <div className="threev0-status-legend">
          <div>
            <i className="is-complete" />
            <span>Selesai</span>
            <b>{metrics.complete}</b>
          </div>
          <div>
            <i className="is-partial" />
            <span>Sebagian</span>
            <b>{metrics.partial}</b>
          </div>
          <div>
            <i className="is-pending" />
            <span>Belum</span>
            <b>{metrics.pending}</b>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ThreeV0UptProgress({
  summaries,
}: {
  summaries: ThreeV0UptSummary[];
}) {
  return (
    <article className="panel proteksi-panel">
      <div className="proteksi-panel-head">
        <span>
          <strong>
            Progress per UPT
          </strong>
          <small>
            Penarikan Analog dan Aktivasi
            Alarm 3V0
          </small>
        </span>
        <ListChecks size={18} />
      </div>

      <div className="proteksi-upt-list threev0-upt-list">
        {summaries.map((summary) => {
          const analogPercent =
            percentage(
              summary.analogRealized,
              summary.total,
            );

          const alarmPercent =
            percentage(
              summary.alarmRealized,
              summary.total,
            );

          return (
            <div
              className="proteksi-upt-row"
              key={summary.upt}
            >
              <div className="proteksi-upt-label">
                <i className="threev0-upt-dot" />
                <span>{summary.upt}</span>
                <small>
                  {summary.complete}/
                  {summary.total} selesai
                </small>
              </div>

              <div className="proteksi-upt-bars">
                <div>
                  <span>Analog</span>
                  <div className="proteksi-upt-track">
                    <i
                      className="is-first"
                      style={{
                        width:
                          `${analogPercent}%`,
                      }}
                    />
                  </div>
                  <b>
                    {summary.analogRealized}/
                    {summary.total}
                  </b>
                </div>

                <div>
                  <span>3V0</span>
                  <div className="proteksi-upt-track">
                    <i
                      className="is-second"
                      style={{
                        width:
                          `${alarmPercent}%`,
                      }}
                    />
                  </div>
                  <b>
                    {summary.alarmRealized}/
                    {summary.total}
                  </b>
                </div>
              </div>
            </div>
          );
        })}

        {summaries.length === 0 && (
          <p className="proteksi-empty">
            Tidak ada data UPT untuk filter ini.
          </p>
        )}
      </div>
    </article>
  );
}

export function ThreeV0TimelinePanel({
  title,
  subtitle,
  points,
}: {
  title: string;
  subtitle: string;
  points: ThreeV0MonthPoint[];
}) {
  const maximum = Math.max(
    1,
    ...points.flatMap((point) => [
      point.target,
      point.realized,
    ]),
  );

  return (
    <article className="panel proteksi-panel">
      <div className="proteksi-panel-head">
        <span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
        <Clock3 size={18} />
      </div>

      {points.length > 0 ? (
        <>
          <div className="threev0-timeline-scroll">
            <div
              className="threev0-timeline"
              style={{
                gridTemplateColumns:
                  `repeat(${points.length}, minmax(58px, 1fr))`,
              }}
            >
              {points.map((point) => (
                <div
                  className="threev0-timeline-column"
                  key={point.month}
                >
                  <div className="threev0-timeline-values">
                    <div>
                      <small>
                        {point.target}
                      </small>
                      <i
                        className="is-target"
                        style={{
                          height:
                            `${Math.max(
                              point.target > 0
                                ? 6
                                : 0,
                              Math.round(
                                (point.target /
                                  maximum) *
                                  100,
                              ),
                            )}%`,
                        }}
                      />
                    </div>

                    <div>
                      <small>
                        {point.realized}
                      </small>
                      <i
                        className="is-realized"
                        style={{
                          height:
                            `${Math.max(
                              point.realized > 0
                                ? 6
                                : 0,
                              Math.round(
                                (point.realized /
                                  maximum) *
                                  100,
                              ),
                            )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <b>{point.label}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="threev0-timeline-legend">
            <span>
              <i className="is-target" />
              Target
            </span>
            <span>
              <i className="is-realized" />
              Realisasi
            </span>
          </div>
        </>
      ) : (
        <p className="proteksi-empty">
          Target / realisasi bulanan belum
          tersedia untuk filter ini.
        </p>
      )}
    </article>
  );
}
