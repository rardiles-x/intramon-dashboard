import { ShieldCheck } from "lucide-react";
import { useMemo } from "react";

export type DistributionItem = {
  label: string;
  count: number;
  color: string;
};

type DistributionDonutProps = {
  title: string;
  subtitle: string;
  total: number;
  items: DistributionItem[];
  ariaLabel: string;
};

const DONUT_RADIUS = 42;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export function DistributionDonut({
  title,
  subtitle,
  total,
  items,
  ariaLabel,
}: DistributionDonutProps) {
  const segments = useMemo(() => {
    let accumulatedOffset = 0;

    return items.map((item) => {
      const length =
        total > 0
          ? (item.count / total) * DONUT_CIRCUMFERENCE
          : 0;
      const segment = {
        ...item,
        length,
        offset: accumulatedOffset,
      };

      accumulatedOffset += length;

      return segment;
    });
  }, [items, total]);

  return (
    <article className="panel proteksi-panel">
      <div className="proteksi-panel-head">
        <span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
        <ShieldCheck size={17} />
      </div>

      <div className="proteksi-donut-layout">
        <div className="proteksi-donut">
          <svg viewBox="0 0 110 110" role="img" aria-label={ariaLabel}>
            <circle
              className="proteksi-donut-base"
              cx="55"
              cy="55"
              r={DONUT_RADIUS}
            />
            {segments.map((segment) => (
              <circle
                key={segment.label}
                cx="55"
                cy="55"
                r={DONUT_RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth="13"
                strokeDasharray={
                  `${segment.length} ` +
                  `${DONUT_CIRCUMFERENCE - segment.length}`
                }
                strokeDashoffset={-segment.offset}
                strokeLinecap="butt"
                transform="rotate(-90 55 55)"
              />
            ))}
          </svg>
          <span>
            <strong>{total.toLocaleString("id-ID")}</strong>
            <small>bay</small>
          </span>
        </div>

        <div className="proteksi-legend">
          {items.map((item) => (
            <div key={item.label}>
              <i style={{ background: item.color }} />
              <span title={item.label}>{item.label}</span>
              <b>{item.count.toLocaleString("id-ID")}</b>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
