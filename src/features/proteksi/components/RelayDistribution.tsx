import { useMemo } from "react";
import type { ProtectionRecord } from "../types";
import {
  DistributionDonut,
  type DistributionItem,
} from "./DistributionDonut";

export function RelayDistribution({
  records,
}: {
  records: ProtectionRecord[];
}) {
  const items = useMemo<DistributionItem[]>(() => {
    const lcd = records.filter((record) =>
      record.relayTypeNormalized.includes("LCD"),
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

  return (
    <DistributionDonut
      title="Distribusi Jenis Relai"
      subtitle="Komposisi bay berdasarkan jenis relai MPU"
      total={records.length}
      items={items}
      ariaLabel="Distribusi jenis relai"
    />
  );
}
