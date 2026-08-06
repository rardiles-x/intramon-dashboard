import { useMemo } from "react";
import type { ProtectionRecord } from "../types";
import {
  DistributionDonut,
  type DistributionItem,
} from "./DistributionDonut";

const MAX_VISIBLE_BRANDS = 5;
const BRAND_COLORS = [
  "#2c7be5",
  "#00a96a",
  "#7c3aed",
  "#f59e0b",
  "#ef4444",
];

function normalizeBrandLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function RelayBrandDistribution({
  records,
}: {
  records: ProtectionRecord[];
}) {
  const items = useMemo<DistributionItem[]>(() => {
    const grouped = new Map<
      string,
      { label: string; count: number }
    >();

    records.forEach((record) => {
      const label =
        normalizeBrandLabel(record.relayBrand) || "Tidak diketahui";
      const key = label.toLocaleUpperCase("id-ID");
      const existing = grouped.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        grouped.set(key, { label, count: 1 });
      }
    });

    const brands = [...grouped.values()].sort(
      (left, right) =>
        right.count - left.count ||
        left.label.localeCompare(right.label, "id", {
          sensitivity: "base",
        }),
    );
    const visible = brands.slice(0, MAX_VISIBLE_BRANDS);
    const remaining = brands
      .slice(MAX_VISIBLE_BRANDS)
      .reduce((total, brand) => total + brand.count, 0);
    const result = visible.map(
      (brand, index): DistributionItem => ({
        ...brand,
        color: BRAND_COLORS[index % BRAND_COLORS.length],
      }),
    );

    if (remaining > 0) {
      result.push({
        label: "Lainnya",
        count: remaining,
        color: "#94a3b8",
      });
    }

    return result.length > 0
      ? result
      : [{ label: "Belum ada data", count: 0, color: "#94a3b8" }];
  }, [records]);

  return (
    <DistributionDonut
      title="Distribusi Merk Relai"
      subtitle="Komposisi bay berdasarkan merk MPU"
      total={records.length}
      items={items}
      ariaLabel="Distribusi merk relai"
    />
  );
}
