import {
  THREE_V0_FULL_INDEX,
  THREE_V0_SELECTED_INDEX,
} from "./config";
import type {
  ThreeV0GiMapResult,
  ThreeV0GiNode,
  ThreeV0MonthPoint,
  ThreeV0ProgressStatus,
  ThreeV0Record,
  ThreeV0UptSummary,
} from "./types";
import { GI_COORDINATES } from "../proteksi/data/giCoordinates.generated";
import { normalizeGiKey } from "../proteksi/utils/giProgress";

type ColumnIndexMap = {
  readonly upt: number;
  readonly ultg: number;
  readonly gi: number;
  readonly bay: number;
  readonly sbefModel: number;
  readonly analogStatus: number;
  readonly analogTarget: number;
  readonly analogRealization: number;
  readonly alarmStatus: number;
  readonly alarmTarget: number;
  readonly alarmRealization: number;
  readonly sbefConfiguration: number;
};

const MONTH_NAMES = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const MONTH_ALIASES: Record<string, number> = {
  JAN: 1,
  JANUARI: 1,
  FEB: 2,
  FEBRUARI: 2,
  MAR: 3,
  MARET: 3,
  APR: 4,
  APRIL: 4,
  MEI: 5,
  MAY: 5,
  JUN: 6,
  JUNI: 6,
  JUL: 7,
  JULI: 7,
  AGU: 8,
  AGUSTUS: 8,
  AUG: 8,
  SEP: 9,
  SEPT: 9,
  SEPTEMBER: 9,
  OKT: 10,
  OKTOBER: 10,
  OCT: 10,
  NOV: 11,
  NOVEMBER: 11,
  DES: 12,
  DESEMBER: 12,
  DEC: 12,
};

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !quoted
    ) {
      if (
        character === "\r" &&
        source[index + 1] === "\n"
      ) {
        index += 1;
      }

      row.push(cell);

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  row.push(cell);

  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function getCell(
  row: string[],
  index: number,
): string {
  return (row[index] ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function isHeaderValue(value: string): boolean {
  const normalized = normalize(value);

  return (
    normalized === "UPT" ||
    normalized === "ULTG" ||
    normalized === "GI" ||
    normalized === "GI/GITET" ||
    normalized === "GI/GIS" ||
    normalized === "BAY" ||
    normalized === "NAMA BAY" ||
    normalized.includes("STATUS PENARIKAN") ||
    normalized.includes("AKTIVASI 3V0") ||
    normalized.includes("MERK DAN TIPE SBEF")
  );
}

function isUsefulUpt(value: string): boolean {
  const normalized = normalize(value);

  return (
    normalized !== "" &&
    !isHeaderValue(value) &&
    !/^\d+$/.test(normalized)
  );
}

function isUsefulUltg(value: string): boolean {
  return (
    normalize(value) !== "" &&
    !isHeaderValue(value)
  );
}

function isUsefulGi(value: string): boolean {
  const normalized = normalize(value);

  return (
    normalized !== "" &&
    !isHeaderValue(value) &&
    /\b(?:GI|GIS|GITET)\b/.test(normalized)
  );
}

function isUsefulBay(value: string): boolean {
  const normalized = normalize(value);

  return (
    normalized !== "" &&
    !isHeaderValue(value) &&
    normalized !== "TRAFO"
  );
}

export function isRealized(value: string): boolean {
  const normalized = normalize(value);

  if (!normalized) {
    return false;
  }

  return ![
    "-",
    "BELUM",
    "BELUM ADA",
    "TIDAK",
    "NO",
    "N/A",
    "NA",
    "NONE",
  ].includes(normalized);
}

export function implementationTone(
  value: string,
): ThreeV0ProgressStatus {
  const normalized = normalize(value);

  if (
    normalized.includes("SUDAH") ||
    normalized.includes("SELESAI")
  ) {
    return "complete";
  }

  if (
    !normalized ||
    normalized.includes("BELUM")
  ) {
    return "pending";
  }

  return "partial";
}

export function getRecordStatus(
  analogRealization: string,
  alarmRealization: string,
): ThreeV0ProgressStatus {
  const analog = isRealized(analogRealization);
  const alarm = isRealized(alarmRealization);

  if (analog && alarm) {
    return "complete";
  }

  if (!analog && !alarm) {
    return "pending";
  }

  return "partial";
}

function buildRecords(
  rows: string[][],
  indexMap: ColumnIndexMap,
): ThreeV0Record[] {
  const records: ThreeV0Record[] = [];
  let inheritedUpt = "";
  let inheritedUltg = "";
  let inheritedGi = "";

  rows.forEach((row, rowIndex) => {
    const directUpt = getCell(row, indexMap.upt);
    const directUltg = getCell(row, indexMap.ultg);
    const directGi = getCell(row, indexMap.gi);
    const bay = getCell(row, indexMap.bay);

    if (isUsefulUpt(directUpt)) {
      inheritedUpt = directUpt;
    }

    if (isUsefulUltg(directUltg)) {
      inheritedUltg = directUltg;
    }

    if (isUsefulGi(directGi)) {
      inheritedGi = directGi;
    }

    const upt = isUsefulUpt(directUpt)
      ? directUpt
      : inheritedUpt;

    const ultg = isUsefulUltg(directUltg)
      ? directUltg
      : inheritedUltg;

    const gi = isUsefulGi(directGi)
      ? directGi
      : inheritedGi;

    if (
      !isUsefulUpt(upt) ||
      !isUsefulGi(gi) ||
      !isUsefulBay(bay)
    ) {
      return;
    }

    const sbefModel = getCell(
      row,
      indexMap.sbefModel,
    );

    const analogStatus = getCell(
      row,
      indexMap.analogStatus,
    );

    const analogTarget = getCell(
      row,
      indexMap.analogTarget,
    );

    const analogRealization = getCell(
      row,
      indexMap.analogRealization,
    );

    const alarmStatus = getCell(
      row,
      indexMap.alarmStatus,
    );

    const alarmTarget = getCell(
      row,
      indexMap.alarmTarget,
    );

    const alarmRealization = getCell(
      row,
      indexMap.alarmRealization,
    );

    const sbefConfiguration = getCell(
      row,
      indexMap.sbefConfiguration,
    );

    records.push({
      id:
        `${normalizeGiKey(gi)}::` +
        `${normalize(bay)}::${rowIndex + 1}`,
      upt,
      ultg,
      gi,
      bay,
      sbefModel,
      analogStatus,
      analogTarget,
      analogRealization,
      alarmStatus,
      alarmTarget,
      alarmRealization,
      sbefConfiguration,
      status: getRecordStatus(
        analogRealization,
        alarmRealization,
      ),
    });
  });

  return records;
}

export function parseSelectedThreeV0Csv(
  text: string,
): ThreeV0Record[] {
  return buildRecords(
    parseCsvRows(text),
    THREE_V0_SELECTED_INDEX,
  );
}

export function parseFullThreeV0Csv(
  text: string,
): ThreeV0Record[] {
  const rows = parseCsvRows(text);
  const widestRow = Math.max(
    0,
    ...rows.map((row) => row.length),
  );

  if (widestRow <= THREE_V0_FULL_INDEX.sbefConfiguration) {
    throw new Error(
      `CSV hanya memiliki ${widestRow} kolom; ` +
        "kolom AV belum tersedia.",
    );
  }

  return buildRecords(
    rows,
    THREE_V0_FULL_INDEX,
  );
}

export function percentage(
  value: number,
  total: number,
): number {
  return total > 0
    ? Math.round((value / total) * 100)
    : 0;
}

export function getThreeV0Metrics(
  records: ThreeV0Record[],
) {
  const analogRealized = records.filter(
    (record) =>
      isRealized(record.analogRealization),
  ).length;

  const alarmRealized = records.filter(
    (record) =>
      isRealized(record.alarmRealization),
  ).length;

  const complete = records.filter(
    (record) => record.status === "complete",
  ).length;

  const partial = records.filter(
    (record) => record.status === "partial",
  ).length;

  const pending = records.filter(
    (record) => record.status === "pending",
  ).length;

  return {
    total: records.length,
    analogRealized,
    alarmRealized,
    complete,
    partial,
    pending,
    progress:
      records.length > 0
        ? Math.round(
            ((analogRealized + alarmRealized) /
              (records.length * 2)) *
              100,
          )
        : 0,
  };
}

export function getThreeV0UptSummaries(
  records: ThreeV0Record[],
): ThreeV0UptSummary[] {
  const summaries = new Map<
    string,
    ThreeV0UptSummary
  >();

  records.forEach((record) => {
    const current =
      summaries.get(record.upt) ?? {
        upt: record.upt,
        total: 0,
        analogRealized: 0,
        alarmRealized: 0,
        complete: 0,
      };

    current.total += 1;
    current.analogRealized += Number(
      isRealized(record.analogRealization),
    );
    current.alarmRealized += Number(
      isRealized(record.alarmRealization),
    );
    current.complete += Number(
      record.status === "complete",
    );

    summaries.set(record.upt, current);
  });

  return [...summaries.values()].sort(
    (left, right) =>
      left.upt.localeCompare(
        right.upt,
        "id",
        {
          numeric: true,
          sensitivity: "base",
        },
      ),
  );
}

function monthIndex(value: string): number | null {
  const normalized = normalize(value)
    .replace(/\./g, "")
    .replace(/,/g, " ");

  if (!normalized) {
    return null;
  }

  for (const [name, month] of Object.entries(
    MONTH_ALIASES,
  )) {
    if (
      normalized === name ||
      normalized.startsWith(`${name} `) ||
      normalized.includes(` ${name} `) ||
      normalized.endsWith(` ${name}`)
    ) {
      return month;
    }
  }

  const numericMatch = normalized.match(
    /^(\d{1,2})[/-](\d{1,2})(?:[/-]\d{2,4})?$/,
  );

  if (numericMatch) {
    const first = Number(numericMatch[1]);
    const second = Number(numericMatch[2]);

    if (first >= 1 && first <= 31) {
      if (second >= 1 && second <= 12) {
        return second;
      }
    }
  }

  const isoMatch = normalized.match(
    /^\d{4}[/-](\d{1,2})(?:[/-]\d{1,2})?$/,
  );

  if (isoMatch) {
    const month = Number(isoMatch[1]);

    return month >= 1 && month <= 12
      ? month
      : null;
  }

  return null;
}

export function buildMonthTimeline(
  records: ThreeV0Record[],
  targetKey:
    | "analogTarget"
    | "alarmTarget",
  realizationKey:
    | "analogRealization"
    | "alarmRealization",
): ThreeV0MonthPoint[] {
  const points = Array.from(
    { length: 12 },
    (_, index) => ({
      month: index + 1,
      label: MONTH_NAMES[index + 1] ?? "",
      target: 0,
      realized: 0,
    }),
  );

  records.forEach((record) => {
    const targetMonth = monthIndex(
      record[targetKey],
    );

    const realizationMonth = monthIndex(
      record[realizationKey],
    );

    if (targetMonth) {
      points[targetMonth - 1]!.target += 1;
    }

    if (realizationMonth) {
      points[realizationMonth - 1]!.realized += 1;
    }
  });

  return points.filter(
    (point) =>
      point.target > 0 ||
      point.realized > 0,
  );
}

export function uniqueValues(
  values: string[],
): string[] {
  const valuesByKey = new Map<
    string,
    string
  >();

  values.forEach((value) => {
    const display = value
      .trim()
      .replace(/\s+/g, " ");

    if (!display) {
      return;
    }

    const key = normalize(display);

    if (!valuesByKey.has(key)) {
      valuesByKey.set(key, display);
    }
  });

  return [...valuesByKey.values()].sort(
    (left, right) =>
      left.localeCompare(
        right,
        "id",
        {
          numeric: true,
          sensitivity: "base",
        },
      ),
  );
}

export function escapeCsv(
  value: string | number,
): string {
  const source = String(value);

  if (/[",\r\n]/.test(source)) {
    return `"${source.replaceAll('"', '""')}"`;
  }

  return source;
}

export function buildThreeV0GiMap(
  records: ThreeV0Record[],
): ThreeV0GiMapResult {
  const groups = new Map<
    string,
    ThreeV0Record[]
  >();

  records.forEach((record) => {
    const key = normalizeGiKey(record.gi);

    if (!key) {
      return;
    }

    const group = groups.get(key);

    if (group) {
      group.push(record);
    } else {
      groups.set(key, [record]);
    }
  });

  const nodes: ThreeV0GiNode[] = [];
  const unresolvedGi: string[] = [];

  for (const [key, group] of groups) {
    const first = group[0];

    if (!first) {
      continue;
    }

    const coordinate = GI_COORDINATES[key];

    if (!coordinate) {
      unresolvedGi.push(first.gi || key);
      continue;
    }

    const analogRealized = group.filter(
      (record) =>
        isRealized(record.analogRealization),
    ).length;

    const alarmRealized = group.filter(
      (record) =>
        isRealized(record.alarmRealization),
    ).length;

    const completeBay = group.filter(
      (record) =>
        record.status === "complete",
    ).length;

    const hasAnyRealization =
      analogRealized > 0 ||
      alarmRealized > 0;

    const allComplete =
      completeBay === group.length &&
      group.length > 0;

    const status: ThreeV0ProgressStatus =
      allComplete
        ? "complete"
        : hasAnyRealization
          ? "partial"
          : "pending";

    nodes.push({
      id: key,
      gi: first.gi,
      upt: first.upt,
      ultg: first.ultg,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      precision: coordinate.precision,
      locationLabel: coordinate.displayName,
      status,
      totalBay: group.length,
      analogRealized,
      alarmRealized,
      completeBay,
      progress: Math.round(
        ((analogRealized + alarmRealized) /
          Math.max(group.length * 2, 1)) *
          100,
      ),
      bays: group.map((record) => ({
        bay: record.bay,
        analogRealization:
          record.analogRealization,
        alarmRealization:
          record.alarmRealization,
        status: record.status,
      })),
    });
  }

  return {
    nodes: nodes.sort(
      (left, right) =>
        left.upt.localeCompare(
          right.upt,
          "id",
          {
            sensitivity: "base",
          },
        ) ||
        left.gi.localeCompare(
          right.gi,
          "id",
          {
            sensitivity: "base",
          },
        ),
    ),
    unresolvedGi: [
      ...new Set(unresolvedGi),
    ].sort((left, right) =>
      left.localeCompare(
        right,
        "id",
        {
          sensitivity: "base",
        },
      ),
    ),
  };
}
