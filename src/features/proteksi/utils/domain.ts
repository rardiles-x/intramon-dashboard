import {
  COLUMN_REFERENCES,
  HEADER_SEARCH_LIMIT,
  MONTH_LABELS,
  MONTHS,
  SOURCE_COLUMN_INDEX,
} from "../config";
import type {
  ProtectionRecord,
  SourceColumnKey,
  TimelineDateKey,
  TimelinePoint,
  UptSummary,
} from "../types";

export const hasRealizationDate = (value: string) =>
  parseDateValue(value) !== null;

export const percentage = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

function parseCsvRows(text: string): string[][] {
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

    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") {
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

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getCell(
  row: string[],
  columnIndex: number,
) {
  if (columnIndex < 0) {
    return "";
  }

  return (row[columnIndex] ?? "").trim();
}

function looksLikeConfiguredHeader(row: string[]) {
  const upt = normalizeHeader(
    getCell(row, SOURCE_COLUMN_INDEX.upt),
  );
  const ultg = normalizeHeader(
    getCell(row, SOURCE_COLUMN_INDEX.ultg),
  );
  const gi = normalizeHeader(
    getCell(row, SOURCE_COLUMN_INDEX.gi),
  );
  const bay = normalizeHeader(
    getCell(row, SOURCE_COLUMN_INDEX.bay),
  );

  return (
    (upt === "upt" || upt.includes("unit pelaksana")) &&
    (ultg === "ultg" || ultg.includes("unit layanan")) &&
    (gi === "gi" || gi.includes("nama gi") || gi.includes("gis")) &&
    (bay === "bay" || bay.includes("nama bay"))
  );
}

function looksLikeDataRow(row: string[]) {
  const upt = normalizeHeader(
    getCell(row, SOURCE_COLUMN_INDEX.upt),
  );
  const ultg = normalizeHeader(
    getCell(row, SOURCE_COLUMN_INDEX.ultg),
  );
  const gi = normalizeHeader(
    getCell(row, SOURCE_COLUMN_INDEX.gi),
  );
  const bay = normalizeHeader(
    getCell(row, SOURCE_COLUMN_INDEX.bay),
  );

  const headerWords = new Set([
    "upt",
    "ultg",
    "gi",
    "gis",
    "nama gi gis",
    "bay",
    "nama bay",
  ]);

  const hasIdentity = [ultg, gi, bay].some(
    (value) => value !== "" && !headerWords.has(value),
  );
  const hasUpt = upt !== "" && !headerWords.has(upt);

  return hasIdentity && (hasUpt || bay !== "");
}

function findDataStartIndex(rows: string[][]) {
  const searchLimit = Math.min(rows.length, HEADER_SEARCH_LIMIT);

  for (let rowIndex = 0; rowIndex < searchLimit; rowIndex += 1) {
    if (looksLikeConfiguredHeader(rows[rowIndex] ?? [])) {
      for (
        let dataIndex = rowIndex + 1;
        dataIndex < rows.length;
        dataIndex += 1
      ) {
        if (looksLikeDataRow(rows[dataIndex] ?? [])) {
          return dataIndex;
        }
      }
    }
  }

  for (let rowIndex = 0; rowIndex < searchLimit; rowIndex += 1) {
    if (looksLikeDataRow(rows[rowIndex] ?? [])) {
      return rowIndex;
    }
  }

  throw new Error(
    "Baris data tidak ditemukan. Periksa kolom C, D, E, dan F.",
  );
}

function validateConfiguredColumns(rows: string[][]) {
  const maximumIndex = Math.max(
    ...Object.values(SOURCE_COLUMN_INDEX),
  );
  const widestRow = Math.max(0, ...rows.map((row) => row.length));

  if (widestRow <= maximumIndex) {
    const missing = Object.entries(SOURCE_COLUMN_INDEX)
      .filter(([, columnIndex]) => columnIndex >= widestRow)
      .map(
        ([key]) =>
          `${COLUMN_REFERENCES[key as SourceColumnKey]} ` +
          `(${key})`,
      )
      .join(", ");

    throw new Error(
      `Spreadsheet hanya memiliki ${widestRow} kolom. ` +
        `Kolom yang belum tersedia: ${missing}.`,
    );
  }
}

function normalizeCritical(value: string) {
  const normalized = value.trim().toUpperCase();

  if (/^(YA|YES|Y)\b/.test(normalized)) {
    return "YA";
  }

  if (/^(TIDAK|NO|N)\b/.test(normalized)) {
    return "TIDAK";
  }

  return normalized;
}

export function parseProtectionCsv(text: string): ProtectionRecord[] {
  const rows = parseCsvRows(text);

  if (rows.length === 0) {
    return [];
  }

  validateConfiguredColumns(rows);
  const dataStartIndex = findDataStartIndex(rows);
  const records: ProtectionRecord[] = [];

  let inheritedUpt = "";
  let inheritedUltg = "";
  let inheritedGi = "";

  rows.slice(dataStartIndex).forEach((row, rowIndex) => {
    const directUpt = getCell(row, SOURCE_COLUMN_INDEX.upt);
    const directUltg = getCell(row, SOURCE_COLUMN_INDEX.ultg);
    const directGi = getCell(row, SOURCE_COLUMN_INDEX.gi);
    const bay = getCell(row, SOURCE_COLUMN_INDEX.bay);

    if (directUpt) {
      inheritedUpt = directUpt;
    }

    if (directUltg) {
      inheritedUltg = directUltg;
    }

    if (directGi) {
      inheritedGi = directGi;
    }

    const upt = directUpt || inheritedUpt;
    const ultg = directUltg || inheritedUltg;
    const gi = directGi || inheritedGi;
    const relayType = getCell(
      row,
      SOURCE_COLUMN_INDEX.relayType,
    );

    const targetAnnunciator = getCell(
      row,
      SOURCE_COLUMN_INDEX.targetAnnunciator,
    );
    const targetDashboard = getCell(
      row,
      SOURCE_COLUMN_INDEX.targetDashboard,
    );
    const ja = getCell(row, SOURCE_COLUMN_INDEX.ja);
    const jb = getCell(row, SOURCE_COLUMN_INDEX.jb);
    const jd = getCell(row, SOURCE_COLUMN_INDEX.jd);
    const je = getCell(row, SOURCE_COLUMN_INDEX.je);

    const normalizedBay = normalizeHeader(bay);
    const isHeader =
      normalizeHeader(upt) === "upt" ||
      normalizeHeader(ultg) === "ultg" ||
      normalizedBay === "bay" ||
      normalizedBay === "nama bay";

    if (
      isHeader ||
      (
        bay === "" &&
        relayType === "" &&
        targetAnnunciator === "" &&
        targetDashboard === "" &&
        ja === "" &&
        jb === "" &&
        jd === "" &&
        je === ""
      )
    ) {
      return;
    }

    records.push({
      no:
        getCell(row, SOURCE_COLUMN_INDEX.no) ||
        String(dataStartIndex + rowIndex + 1),
      upt,
      uptShort: upt.replace(/^UPT\s+/i, "").trim(),
      ultg,
      gi,
      bay,
      redundancy: getCell(
        row,
        SOURCE_COLUMN_INDEX.redundancy,
      ),
      critical: normalizeCritical(
        getCell(row, SOURCE_COLUMN_INDEX.critical),
      ),
      relayType,
      relayTypeNormalized: relayType.toUpperCase(),
      relayBrand: getCell(
        row,
        SOURCE_COLUMN_INDEX.relayBrand,
      ),
      relayModel: getCell(
        row,
        SOURCE_COLUMN_INDEX.relayModel,
      ),
      targetAnnunciator,
      targetDashboard,
      ja,
      jb,
      jd,
      je,
      score:
        Number(hasRealizationDate(ja)) +
        Number(hasRealizationDate(jb)) +
        Number(hasRealizationDate(jd)) +
        Number(hasRealizationDate(je)),
    });
  });

  return records.filter(
    (record) =>
      record.upt !== "" &&
      (
        record.ultg !== "" ||
        record.gi !== "" ||
        record.bay !== ""
      ),
  );
}


type ParsedDateValue = {
  year: number;
  month: number;
  day: number;
  key: string;
  label: string;
  display: string;
};

function createParsedDate(
  year: number,
  month: number,
  day: number,
): ParsedDateValue | null {
  if (
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    key: `${year}-${String(month).padStart(2, "0")}`,
    label: `${MONTH_LABELS[month]} '${String(year).slice(2)}`,
    display: new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date),
  };
}

function findMonth(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .toUpperCase();

  const exact = MONTHS[normalized];

  if (exact) {
    return exact;
  }

  const prefix = normalized.slice(0, 3);

  return Object.entries(MONTHS).find(([name]) =>
    name.startsWith(prefix),
  )?.[1];
}

function parseDateValue(value: string): ParsedDateValue | null {
  const source = value.trim();

  if (!source || source === "-") {
    return null;
  }

  const serialNumber = Number(source.replace(",", "."));

  if (
    Number.isFinite(serialNumber) &&
    serialNumber >= 30_000 &&
    serialNumber <= 80_000
  ) {
    const milliseconds =
      Date.UTC(1899, 11, 30) +
      Math.floor(serialNumber) * 86_400_000;
    const date = new Date(milliseconds);

    return createParsedDate(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
    );
  }

  const normalized = source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  const isoMatch = normalized.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s.*)?$/,
  );

  if (isoMatch) {
    return createParsedDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3]),
    );
  }

  const numericMatch = normalized.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})(?:\s.*)?$/,
  );

  if (numericMatch) {
    const first = Number(numericMatch[1]);
    const second = Number(numericMatch[2]);
    const rawYear = Number(numericMatch[3]);
    const year =
      numericMatch[3].length === 2 ? 2000 + rawYear : rawYear;

    const day = second > 12 ? second : first;
    const month = second > 12 ? first : second;

    return createParsedDate(year, month, day);
  }

  const dayMonthNameMatch = normalized.match(
    /^(\d{1,2})[\s/-]+([A-Z]+)[\s/-]+(\d{2,4})(?:\s.*)?$/,
  );

  if (dayMonthNameMatch) {
    const month = findMonth(dayMonthNameMatch[2]);
    const rawYear = Number(dayMonthNameMatch[3]);
    const year =
      dayMonthNameMatch[3].length === 2
        ? 2000 + rawYear
        : rawYear;

    if (month) {
      return createParsedDate(
        year,
        month,
        Number(dayMonthNameMatch[1]),
      );
    }
  }

  const monthNameDayMatch = normalized.match(
    /^([A-Z]+)[\s/-]+(\d{1,2})[,\s/-]+(\d{4})(?:\s.*)?$/,
  );

  if (monthNameDayMatch) {
    const month = findMonth(monthNameDayMatch[1]);

    if (month) {
      return createParsedDate(
        Number(monthNameDayMatch[3]),
        month,
        Number(monthNameDayMatch[2]),
      );
    }
  }

  return null;
}

function parseYearMonth(value: string) {
  const parsed = parseDateValue(value);

  if (parsed) {
    return {
      year: parsed.year,
      month: parsed.month,
      key: parsed.key,
      label: parsed.label,
    };
  }

  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();

  if (!normalized || normalized === "-") {
    return null;
  }

  const createYearMonth = (year: number, month: number) => {
    if (year < 2000 || year > 2100 || month < 1 || month > 12) {
      return null;
    }

    return {
      year,
      month,
      key: `${year}-${String(month).padStart(2, "0")}`,
      label: `${MONTH_LABELS[month]} '${String(year).slice(2)}`,
    };
  };

  const yearMonthMatch = normalized.match(
    /^(\d{4})[-/](\d{1,2})$/,
  );

  if (yearMonthMatch) {
    return createYearMonth(
      Number(yearMonthMatch[1]),
      Number(yearMonthMatch[2]),
    );
  }

  const monthYearMatch = normalized.match(
    /^(\d{1,2})[-/](\d{4})$/,
  );

  if (monthYearMatch) {
    return createYearMonth(
      Number(monthYearMatch[2]),
      Number(monthYearMatch[1]),
    );
  }

  const monthNameMatch = normalized.match(
    /^([A-Z]+)[\s/-]+(\d{4})$/,
  );

  if (monthNameMatch) {
    const month = findMonth(monthNameMatch[1]);

    if (month) {
      return createYearMonth(
        Number(monthNameMatch[2]),
        month,
      );
    }
  }

  return null;
}

export function formatRealizationDate(value: string) {
  return parseDateValue(value)?.display ?? "Belum";
}


export function getUptSummaries(records: ProtectionRecord[]): UptSummary[] {
  const summaries = new Map<string, UptSummary>();

  for (const record of records) {
    const summary = summaries.get(record.uptShort) ?? {
      upt: record.uptShort,
      total: 0,
      ja: 0,
      jb: 0,
      jd: 0,
      je: 0,
      score4: 0,
    };

    summary.total += 1;
    summary.ja += Number(hasRealizationDate(record.ja));
    summary.jb += Number(hasRealizationDate(record.jb));
    summary.jd += Number(hasRealizationDate(record.jd));
    summary.je += Number(hasRealizationDate(record.je));
    summary.score4 += Number(record.score === 4);
    summaries.set(record.uptShort, summary);
  }

  return [...summaries.values()].sort((left, right) =>
    left.upt.localeCompare(right.upt, "id"),
  );
}

export function buildTimeline(
  records: ProtectionRecord[],
  targetKey: TimelineDateKey,
  firstKey: TimelineDateKey,
  secondKey: TimelineDateKey,
): TimelinePoint[] {
  const target = new Map<string, number>();
  const first = new Map<string, number>();
  const second = new Map<string, number>();
  const labels = new Map<string, string>();

  const addValue = (
    value: string,
    values: Map<string, number>,
  ) => {
    const parsed = parseYearMonth(value);

    if (!parsed) {
      return;
    }

    labels.set(parsed.key, parsed.label);
    values.set(
      parsed.key,
      (values.get(parsed.key) ?? 0) + 1,
    );
  };

  for (const record of records) {
    addValue(record[targetKey], target);
    addValue(record[firstKey], first);
    addValue(record[secondKey], second);
  }

  const keys = [
    ...new Set([
      ...target.keys(),
      ...first.keys(),
      ...second.keys(),
    ]),
  ].sort();

  let cumulativeTarget = 0;
  let cumulativeFirst = 0;
  let cumulativeSecond = 0;

  return keys.map((key) => {
    const targetValue = target.get(key) ?? 0;
    const firstValue = first.get(key) ?? 0;
    const secondValue = second.get(key) ?? 0;

    cumulativeTarget += targetValue;
    cumulativeFirst += firstValue;
    cumulativeSecond += secondValue;

    return {
      key,
      label: labels.get(key) ?? key,
      target: targetValue,
      first: firstValue,
      second: secondValue,
      cumulativeTarget,
      cumulativeFirst,
      cumulativeSecond,
    };
  });
}

export function escapeCsv(value: string | number) {
  const source = String(value);

  if (/[",\r\n]/.test(source)) {
    return `"${source.replaceAll('"', '""')}"`;
  }

  return source;
}
