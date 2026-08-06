import { GI_COORDINATES } from "../data/giCoordinates.generated";
import type {
  GiProgressMapResult,
  GiProgressNode,
  ProtectionRecord,
} from "../types";
import { hasRealizationDate } from "./domain";

export function normalizeGiKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\bGARDU\s+INDUK\b/g, " ")
    .replace(/\bGIS\b/g, " ")
    .replace(/\bGI\b/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function isRecordComplete(record: ProtectionRecord) {
  return (
    hasRealizationDate(record.ja) &&
    hasRealizationDate(record.jb) &&
    hasRealizationDate(record.jd) &&
    hasRealizationDate(record.je)
  );
}

export function buildGiProgressMap(
  records: ProtectionRecord[],
): GiProgressMapResult {
  const groups = new Map<string, ProtectionRecord[]>();

  for (const record of records) {
    const key = normalizeGiKey(record.gi);

    if (!key) {
      continue;
    }

    const group = groups.get(key);

    if (group) {
      group.push(record);
    } else {
      groups.set(key, [record]);
    }
  }

  const nodes: GiProgressNode[] = [];
  const unresolvedGi: string[] = [];

  for (const [key, group] of groups) {
    const coordinate = GI_COORDINATES[key];
    const first = group[0];

    if (!first) {
      continue;
    }

    if (!coordinate) {
      unresolvedGi.push(first.gi || key);
      continue;
    }

    const completeBay = group.filter(isRecordComplete).length;
    const ja = group.filter((record) =>
      hasRealizationDate(record.ja),
    ).length;
    const jb = group.filter((record) =>
      hasRealizationDate(record.jb),
    ).length;
    const jd = group.filter((record) =>
      hasRealizationDate(record.jd),
    ).length;
    const je = group.filter((record) =>
      hasRealizationDate(record.je),
    ).length;
    const hasAllGiIndicators =
      ja > 0 &&
      jb > 0 &&
      jd > 0 &&
      je > 0;

    nodes.push({
      id: key,
      gi: first.gi || key,
      upt: first.uptShort,
      ultg: first.ultg.replace(/^ULTG\s+/i, "").trim(),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      precision: coordinate.precision,
      locationLabel: coordinate.displayName,
      status: hasAllGiIndicators ? "complete" : "incomplete",
      totalBay: group.length,
      completeBay,
      incompleteBay: group.length - completeBay,
      ja,
      jb,
      jd,
      je,
    });
  }

  return {
    nodes: nodes.sort(
      (left, right) =>
        left.upt.localeCompare(right.upt, "id", {
          sensitivity: "base",
        }) ||
        left.gi.localeCompare(right.gi, "id", {
          sensitivity: "base",
        }),
    ),
    unresolvedGi: [...new Set(unresolvedGi)].sort((left, right) =>
      left.localeCompare(right, "id", {
        sensitivity: "base",
      }),
    ),
  };
}
