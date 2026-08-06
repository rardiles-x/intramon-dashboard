// src/components/ProteksiDashboard.tsx
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Target,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ChangeEvent, CSSProperties } from "react";
import "./ProteksiDashboard.css";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTF582KzohQo5LW0gWLPiK60V-bHmBWQ_EZ3mxYPkf8m5oalArzAo78jKttHAnHZTlEGRGhoUZkmJ5q/pub?gid=855839774&single=true&output=csv";
const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1l3dyT_K1SlvOARCLtm6r3KgEz_eNzaMm67tocnY574g/edit?gid=855839774#gid=855839774";
const PAGE_SIZE = 25;

type SourceColumnKey =
  | "no"
  | "upt"
  | "ultg"
  | "gi"
  | "bay"
  | "critical"
  | "relayType"
  | "ja"
  | "jb"
  | "jc"
  | "jd"
  | "je"
  | "jf";

type ColumnMap = Record<SourceColumnKey, number>;

const SOURCE_COLUMN_KEYS: readonly SourceColumnKey[] = [
  "no",
  "upt",
  "ultg",
  "gi",
  "bay",
  "critical",
  "relayType",
  "ja",
  "jb",
  "jc",
  "jd",
  "je",
  "jf",
];

const REQUIRED_SOURCE_COLUMNS: readonly SourceColumnKey[] = [
  "upt",
  "ultg",
  "gi",
  "bay",
  "critical",
  "relayType",
  "ja",
  "jb",
  "jc",
  "jd",
  "je",
  "jf",
];

const COLUMN_LABELS: Record<SourceColumnKey, string> = {
  no: "No",
  upt: "UPT",
  ultg: "ULTG",
  gi: "GI",
  bay: "Bay",
  critical: "Kritikal",
  relayType: "Jenis Relai",
  ja: "FO Fail → Annunciator",
  jb: "I Diff → Annunciator",
  jc: "Target Annunciator",
  jd: "FO Fail → Dashboard",
  je: "I Diff → Dashboard",
  jf: "Target Dashboard",
};

const HEADER_ALIASES: Record<SourceColumnKey, readonly string[]> = {
  no: ["no", "nomor", "nomor urut", "urut"],
  upt: [
    "upt",
    "unit pelaksana transmisi",
    "unit pelaksana",
  ],
  ultg: [
    "ultg",
    "unit layanan transmisi gardu induk",
    "unit layanan transmisi",
  ],
  gi: ["gi", "gardu induk"],
  bay: ["bay", "nama bay", "bay penghantar", "bay trafo"],
  critical: [
    "kritikal",
    "critical",
    "status kritikal",
    "bay kritikal",
    "prioritas kritikal",
  ],
  relayType: [
    "jenis relai",
    "jenis relay",
    "tipe relai",
    "tipe relay",
    "relay type",
    "merk tipe relai",
  ],
  ja: [
    "ja",
    "fo fail annunciator",
    "fo fail ke annunciator",
    "fo fail annunciator scada",
    "penarikan fo fail annunciator",
  ],
  jb: [
    "jb",
    "i diff annunciator",
    "idiff annunciator",
    "i diff ke annunciator",
    "penarikan i diff annunciator",
  ],
  jc: [
    "jc",
    "target annunciator",
    "target ke annunciator",
    "target penarikan annunciator",
  ],
  jd: [
    "jd",
    "fo fail dashboard",
    "fo fail ke dashboard",
    "penarikan fo fail dashboard",
  ],
  je: [
    "je",
    "i diff dashboard",
    "idiff dashboard",
    "i diff ke dashboard",
    "penarikan i diff dashboard",
  ],
  jf: [
    "jf",
    "target dashboard",
    "target ke dashboard",
    "target penarikan dashboard",
  ],
};

/**
 * Isi hanya jika nama header spreadsheet sangat khusus dan tidak cocok
 * dengan HEADER_ALIASES. Angka memakai indeks kolom berbasis nol.
 *
 * Contoh:
 * const COLUMN_OVERRIDES = {
 *   upt: "Unit Transmisi",
 *   bay: 4,
 * } satisfies Partial<Record<SourceColumnKey, string | number>>;
 */
const COLUMN_OVERRIDES: Partial<
  Record<SourceColumnKey, string | number>
> = {};

const HEADER_SEARCH_LIMIT = 20;
const HEADER_CONTEXT_DEPTH = 3;


const MONTHS: Record<string, number> = {
  JANUARI: 1,
  FEBRUARI: 2,
  MARET: 3,
  APRIL: 4,
  MEI: 5,
  JUNI: 6,
  JULI: 7,
  AGUSTUS: 8,
  SEPTEMBER: 9,
  OKTOBER: 10,
  NOVEMBER: 11,
  DESEMBER: 12,
};

const MONTH_LABELS = [
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

const UPT_COLORS: Record<string, string> = {
  BALI: "#2563eb",
  GRESIK: "#16a34a",
  MADIUN: "#d97706",
  MALANG: "#7c3aed",
  PROBOLINGGO: "#dc2626",
  SURABAYA: "#0891b2",
};

type LoadStatus = "loading" | "ready" | "error";
type CriticalFilter = "" | "YA" | "TIDAK";
type RelayFilter = "" | "LCD" | "Distance";
type ScoreFilter = "" | "0" | "1" | "2" | "3" | "4";
type CompletionKey = "ja" | "jb" | "jd" | "je";
type TargetKey = "jc" | "jf";
type SortKey =
  | "uptShort"
  | "ultg"
  | "gi"
  | "bay"
  | "critical"
  | "relayType"
  | "score";
type SortDirection = "asc" | "desc";

type ProtectionRecord = {
  no: string;
  upt: string;
  uptShort: string;
  ultg: string;
  gi: string;
  bay: string;
  critical: string;
  relayType: string;
  relayTypeNormalized: string;
  ja: string;
  jb: string;
  jc: string;
  jd: string;
  je: string;
  jf: string;
  score: number;
};

type UptSummary = {
  upt: string;
  total: number;
  ja: number;
  jb: number;
  jd: number;
  je: number;
  score4: number;
};

type TimelinePoint = {
  key: string;
  label: string;
  actual: number;
  target: number;
  targetGroup: "2025" | "2026" | "2027+";
  cumulativeActual: number;
  cumulativeAll: number;
};

type MetricCardProps = {
  label: string;
  value: number;
  detail: string;
  tone: "blue" | "amber" | "green" | "red" | "violet" | "cyan";
};

type ProgressItem = {
  label: string;
  key: CompletionKey;
  count: number;
  percent: number;
  tone: "blue" | "red" | "green" | "violet";
};

const hasValue = (value: string) => {
  const normalized = value.trim();
  return normalized !== "" && normalized !== "-";
};

const percentage = (value: number, total: number) =>
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
    .replace(/→|->|=>/g, " ke ")
    .replace(/&/g, " dan ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getHeaderVariants(
  rows: string[][],
  headerRowIndex: number,
  columnIndex: number,
) {
  const startRow = Math.max(
    0,
    headerRowIndex - HEADER_CONTEXT_DEPTH + 1,
  );
  const directValues: string[] = [];
  const inheritedValues: string[] = [];

  for (
    let rowIndex = startRow;
    rowIndex <= headerRowIndex;
    rowIndex += 1
  ) {
    const row = rows[rowIndex] ?? [];
    const directValue = (row[columnIndex] ?? "").trim();

    if (directValue) {
      directValues.push(directValue);
      inheritedValues.push(directValue);
      continue;
    }

    for (
      let previousColumn = columnIndex - 1;
      previousColumn >= 0;
      previousColumn -= 1
    ) {
      const inheritedValue = (row[previousColumn] ?? "").trim();

      if (inheritedValue) {
        inheritedValues.push(inheritedValue);
        break;
      }
    }
  }

  const variants = new Set<string>();

  for (const value of directValues) {
    const normalized = normalizeHeader(value);

    if (normalized) {
      variants.add(normalized);
    }
  }

  const directCombined = normalizeHeader(directValues.join(" "));

  if (directCombined) {
    variants.add(directCombined);
  }

  const inheritedCombined = normalizeHeader(
    inheritedValues.join(" "),
  );

  if (inheritedCombined) {
    variants.add(inheritedCombined);
  }

  return [...variants];
}

function scoreHeaderMatch(
  variant: string,
  alias: string,
) {
  const normalizedAlias = normalizeHeader(alias);

  if (!normalizedAlias) {
    return 0;
  }

  if (variant === normalizedAlias) {
    return 1_000 + normalizedAlias.length;
  }

  if (normalizedAlias.length <= 3) {
    return 0;
  }

  const variantWords = variant.split(" ");
  const aliasWords = normalizedAlias.split(" ");
  const containsAllWords = aliasWords.every((word) =>
    variantWords.includes(word),
  );

  if (containsAllWords) {
    return 600 + normalizedAlias.length;
  }

  if (
    variant.includes(normalizedAlias) ||
    normalizedAlias.includes(variant)
  ) {
    return 400 + Math.min(
      variant.length,
      normalizedAlias.length,
    );
  }

  return 0;
}

function resolveOverrideColumn(
  rows: string[][],
  headerRowIndex: number,
  override: string | number,
) {
  if (typeof override === "number") {
    return override >= 0 ? override : null;
  }

  const normalizedOverride = normalizeHeader(override);
  const width = Math.max(
    0,
    ...rows
      .slice(0, headerRowIndex + 1)
      .map((row) => row.length),
  );

  for (let columnIndex = 0; columnIndex < width; columnIndex += 1) {
    const variants = getHeaderVariants(
      rows,
      headerRowIndex,
      columnIndex,
    );

    if (
      variants.some(
        (variant) =>
          variant === normalizedOverride ||
          variant.includes(normalizedOverride),
      )
    ) {
      return columnIndex;
    }
  }

  return null;
}

function resolveColumnsForHeader(
  rows: string[][],
  headerRowIndex: number,
) {
  const width = Math.max(
    0,
    ...rows
      .slice(0, headerRowIndex + 1)
      .map((row) => row.length),
  );
  const candidates: Array<{
    key: SourceColumnKey;
    columnIndex: number;
    score: number;
  }> = [];

  for (const key of SOURCE_COLUMN_KEYS) {
    const override = COLUMN_OVERRIDES[key];

    if (override !== undefined) {
      const overrideColumn = resolveOverrideColumn(
        rows,
        headerRowIndex,
        override,
      );

      if (overrideColumn !== null) {
        candidates.push({
          key,
          columnIndex: overrideColumn,
          score: 10_000,
        });
      }

      continue;
    }

    for (
      let columnIndex = 0;
      columnIndex < width;
      columnIndex += 1
    ) {
      const variants = getHeaderVariants(
        rows,
        headerRowIndex,
        columnIndex,
      );
      let bestScore = 0;

      for (const variant of variants) {
        for (const alias of HEADER_ALIASES[key]) {
          bestScore = Math.max(
            bestScore,
            scoreHeaderMatch(variant, alias),
          );
        }
      }

      if (bestScore > 0) {
        candidates.push({
          key,
          columnIndex,
          score: bestScore,
        });
      }
    }
  }

  candidates.sort(
    (left, right) =>
      right.score - left.score ||
      left.columnIndex - right.columnIndex,
  );

  const assignedKeys = new Set<SourceColumnKey>();
  const assignedColumns = new Set<number>();
  const columns: Partial<ColumnMap> = {};
  let score = 0;

  for (const candidate of candidates) {
    if (
      assignedKeys.has(candidate.key) ||
      assignedColumns.has(candidate.columnIndex)
    ) {
      continue;
    }

    columns[candidate.key] = candidate.columnIndex;
    assignedKeys.add(candidate.key);
    assignedColumns.add(candidate.columnIndex);
    score += candidate.score;
  }

  const requiredCount = REQUIRED_SOURCE_COLUMNS.filter(
    (key) => columns[key] !== undefined,
  ).length;

  return {
    columns,
    requiredCount,
    score,
    headerRowIndex,
  };
}

function detectColumnMap(rows: string[][]) {
  const searchLimit = Math.min(
    rows.length,
    HEADER_SEARCH_LIMIT,
  );
  let bestResolution: ReturnType<
    typeof resolveColumnsForHeader
  > | null = null;

  for (
    let headerRowIndex = 0;
    headerRowIndex < searchLimit;
    headerRowIndex += 1
  ) {
    const resolution = resolveColumnsForHeader(
      rows,
      headerRowIndex,
    );

    if (
      !bestResolution ||
      resolution.requiredCount > bestResolution.requiredCount ||
      (
        resolution.requiredCount ===
          bestResolution.requiredCount &&
        resolution.score > bestResolution.score
      )
    ) {
      bestResolution = resolution;
    }
  }

  if (!bestResolution) {
    throw new Error(
      "Spreadsheet tidak mempunyai baris header yang dapat dibaca.",
    );
  }

  const missingColumns = REQUIRED_SOURCE_COLUMNS.filter(
    (key) => bestResolution?.columns[key] === undefined,
  );

  if (missingColumns.length > 0) {
    const readableMissingColumns = missingColumns
      .map((key) => COLUMN_LABELS[key])
      .join(", ");
    const detectedHeaders = (
      rows[bestResolution.headerRowIndex] ?? []
    )
      .filter((value) => value.trim())
      .join(" | ");

    throw new Error(
      `Kolom spreadsheet tidak lengkap. Tidak ditemukan: ` +
        `${readableMissingColumns}. Header terbaca: ` +
        `${detectedHeaders || "(kosong)"}.`,
    );
  }

  const columns: ColumnMap = {
    no: bestResolution.columns.no ?? -1,
    upt: bestResolution.columns.upt as number,
    ultg: bestResolution.columns.ultg as number,
    gi: bestResolution.columns.gi as number,
    bay: bestResolution.columns.bay as number,
    critical: bestResolution.columns.critical as number,
    relayType: bestResolution.columns.relayType as number,
    ja: bestResolution.columns.ja as number,
    jb: bestResolution.columns.jb as number,
    jc: bestResolution.columns.jc as number,
    jd: bestResolution.columns.jd as number,
    je: bestResolution.columns.je as number,
    jf: bestResolution.columns.jf as number,
  };

  return {
    columns,
    dataStartIndex: bestResolution.headerRowIndex + 1,
  };
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

function parseProtectionCsv(text: string): ProtectionRecord[] {
  const rows = parseCsvRows(text);
  const { columns, dataStartIndex } = detectColumnMap(rows);

  return rows
    .slice(dataStartIndex)
    .map((row, rowIndex) => {
      const upt = getCell(row, columns.upt);
      const relayType = getCell(row, columns.relayType);
      const ja = getCell(row, columns.ja);
      const jb = getCell(row, columns.jb);
      const jd = getCell(row, columns.jd);
      const je = getCell(row, columns.je);

      return {
        no:
          getCell(row, columns.no) ||
          String(dataStartIndex + rowIndex + 1),
        upt,
        uptShort: upt.replace(/^UPT\s+/i, "").trim(),
        ultg: getCell(row, columns.ultg),
        gi: getCell(row, columns.gi),
        bay: getCell(row, columns.bay),
        critical: getCell(
          row,
          columns.critical,
        ).toUpperCase(),
        relayType,
        relayTypeNormalized: relayType.toUpperCase(),
        ja,
        jb,
        jc: getCell(row, columns.jc),
        jd,
        je,
        jf: getCell(row, columns.jf),
        score:
          Number(hasValue(ja)) +
          Number(hasValue(jb)) +
          Number(hasValue(jd)) +
          Number(hasValue(je)),
      };
    })
    .filter(
      (record) =>
        record.upt !== "" &&
        (
          record.ultg !== "" ||
          record.gi !== "" ||
          record.bay !== ""
        ),
    );
}


function parseYearMonth(value: string) {
  if (!value.trim()) {
    return null;
  }

  const source = value.toUpperCase().trim();
  const dayMonthYear = source.match(
    /^(\d{1,2})[-/]([A-Z]+)[-/](\d{2,4})$/,
  );

  if (dayMonthYear) {
    const month = findMonth(dayMonthYear[2]);
    const rawYear = Number(dayMonthYear[3]);
    const year = dayMonthYear[3].length === 2 ? 2000 + rawYear : rawYear;

    if (month && year) {
      return createYearMonth(year, month);
    }
  }

  const monthDayYear = source.match(
    /^([A-Z]+)[-\s](\d{1,2})[-\s](\d{4})$/,
  );

  if (monthDayYear) {
    const month = findMonth(monthDayYear[1]);
    const year = Number(monthDayYear[3]);

    if (month && year) {
      return createYearMonth(year, month);
    }
  }

  const numericDate = source.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (numericDate) {
    const first = Number(numericDate[1]);
    const second = Number(numericDate[2]);
    const year = Number(numericDate[3]);
    const month = first > 12 ? second : first;

    if (month >= 1 && month <= 12) {
      return createYearMonth(year, month);
    }
  }

  let month: number | undefined;

  for (const [name, number] of Object.entries(MONTHS)) {
    if (source.includes(name) || source.startsWith(name.slice(0, 3))) {
      month = number;
      break;
    }
  }

  const yearMatch = source.match(/\b(20(?:24|25|26|27|28))\b/);

  if (!month || !yearMatch) {
    return null;
  }

  return createYearMonth(Number(yearMatch[1]), month);
}

function findMonth(value: string) {
  const exact = MONTHS[value];

  if (exact) {
    return exact;
  }

  const prefix = value.slice(0, 3);
  return Object.entries(MONTHS).find(([name]) =>
    name.startsWith(prefix),
  )?.[1];
}

function createYearMonth(year: number, month: number) {
  return {
    year,
    month,
    key: `${year}-${String(month).padStart(2, "0")}`,
    label: `${MONTH_LABELS[month]} '${String(year).slice(2)}`,
  };
}

function getUptSummaries(records: ProtectionRecord[]): UptSummary[] {
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
    summary.ja += Number(hasValue(record.ja));
    summary.jb += Number(hasValue(record.jb));
    summary.jd += Number(hasValue(record.jd));
    summary.je += Number(hasValue(record.je));
    summary.score4 += Number(record.score === 4);
    summaries.set(record.uptShort, summary);
  }

  return [...summaries.values()].sort((left, right) =>
    left.upt.localeCompare(right.upt, "id"),
  );
}

function buildTimeline(
  records: ProtectionRecord[],
  actualKeys: CompletionKey[],
  targetKey: TargetKey,
): TimelinePoint[] {
  const actual = new Map<string, number>();
  const target = new Map<string, number>();
  const labels = new Map<string, string>();

  for (const record of records) {
    const isActual = actualKeys.some((key) => hasValue(record[key]));
    const actualDate = isActual
      ? actualKeys
          .map((key) => parseYearMonth(record[key]))
          .find((value) => value !== null) ??
        parseYearMonth(record[targetKey])
      : null;
    const targetDate = isActual ? null : parseYearMonth(record[targetKey]);
    const selectedDate = actualDate ?? targetDate;

    if (!selectedDate) {
      continue;
    }

    labels.set(selectedDate.key, selectedDate.label);

    if (actualDate) {
      actual.set(
        selectedDate.key,
        (actual.get(selectedDate.key) ?? 0) + 1,
      );
    } else {
      target.set(
        selectedDate.key,
        (target.get(selectedDate.key) ?? 0) + 1,
      );
    }
  }

  const keys = [...new Set([...actual.keys(), ...target.keys()])].sort();
  let cumulativeActual = 0;
  let cumulativeAll = 0;

  return keys.map((key) => {
    const actualValue = actual.get(key) ?? 0;
    const targetValue = target.get(key) ?? 0;
    cumulativeActual += actualValue;
    cumulativeAll += actualValue + targetValue;

    return {
      key,
      label: labels.get(key) ?? key,
      actual: actualValue,
      target: targetValue,
      targetGroup: key.startsWith("2025")
        ? "2025"
        : key.startsWith("2026")
          ? "2026"
          : "2027+",
      cumulativeActual,
      cumulativeAll,
    };
  });
}

function escapeCsv(value: string | number) {
  const source = String(value);

  if (/[",\r\n]/.test(source)) {
    return `"${source.replaceAll('"', '""')}"`;
  }

  return source;
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: MetricCardProps) {
  return (
    <article className={`proteksi-metric proteksi-tone-${tone}`}>
      <span>{label}</span>
      <strong>{value.toLocaleString("id-ID")}</strong>
      <small>{detail}</small>
    </article>
  );
}

function CompletionDot({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const completed = hasValue(value);

  return (
    <span
      className={`proteksi-completion ${
        completed ? "is-complete" : "is-incomplete"
      }`}
      title={completed ? `${label}: ${value}` : `${label}: belum selesai`}
      aria-label={completed ? `${label} selesai` : `${label} belum selesai`}
    >
      {completed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
    </span>
  );
}

function ProgressPanel({
  items,
  total,
}: {
  items: ProgressItem[];
  total: number;
}) {
  return (
    <article className="panel proteksi-panel">
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

function RelayDistribution({
  records,
}: {
  records: ProtectionRecord[];
}) {
  const segments = useMemo(() => {
    const lcd = records.filter(
      (record) => record.relayTypeNormalized === "LCD",
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

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <article className="panel proteksi-panel">
      <div className="proteksi-panel-head">
        <span>
          <strong>Distribusi Jenis Relai</strong>
          <small>Komposisi bay berdasarkan jenis relai MPU</small>
        </span>
        <ShieldCheck size={17} />
      </div>

      <div className="proteksi-donut-layout">
        <div className="proteksi-donut">
          <svg viewBox="0 0 110 110" role="img" aria-label="Distribusi relai">
            <circle className="proteksi-donut-base" cx="55" cy="55" r={radius} />
            {segments.map((segment) => {
              const length =
                records.length > 0
                  ? (segment.count / records.length) * circumference
                  : 0;
              const currentOffset = offset;
              offset += length;

              return (
                <circle
                  key={segment.label}
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="13"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-currentOffset}
                  strokeLinecap="butt"
                  transform="rotate(-90 55 55)"
                />
              );
            })}
          </svg>
          <span>
            <strong>{records.length}</strong>
            <small>bay</small>
          </span>
        </div>

        <div className="proteksi-legend">
          {segments.map((segment) => (
            <div key={segment.label}>
              <i style={{ background: segment.color }} />
              <span>{segment.label}</span>
              <b>{segment.count}</b>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function UptProgressPanel({
  title,
  subtitle,
  summaries,
  firstKey,
  secondKey,
  firstLabel,
  secondLabel,
}: {
  title: string;
  subtitle: string;
  summaries: UptSummary[];
  firstKey: CompletionKey;
  secondKey: CompletionKey;
  firstLabel: string;
  secondLabel: string;
}) {
  return (
    <article className="panel proteksi-panel proteksi-upt-panel">
      <div className="proteksi-panel-head">
        <span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
      </div>

      <div className="proteksi-upt-list">
        {summaries.length === 0 ? (
          <p className="proteksi-empty">Tidak ada data UPT.</p>
        ) : (
          summaries.map((summary) => {
            const firstPercent = percentage(
              summary[firstKey],
              summary.total,
            );
            const secondPercent = percentage(
              summary[secondKey],
              summary.total,
            );

            return (
              <div className="proteksi-upt-row" key={summary.upt}>
                <div className="proteksi-upt-label">
                  <i
                    style={{
                      background:
                        UPT_COLORS[summary.upt] ?? "var(--muted)",
                    }}
                  />
                  <span>{summary.upt}</span>
                  <small>{summary.total} bay</small>
                </div>

                <div className="proteksi-upt-bars">
                  <div>
                    <span>{firstLabel}</span>
                    <div className="proteksi-upt-track">
                      <i
                        className="is-first"
                        style={{ width: `${firstPercent}%` }}
                      />
                    </div>
                    <b>{summary[firstKey]}/{summary.total}</b>
                  </div>
                  <div>
                    <span>{secondLabel}</span>
                    <div className="proteksi-upt-track">
                      <i
                        className="is-second"
                        style={{ width: `${secondPercent}%` }}
                      />
                    </div>
                    <b>{summary[secondKey]}/{summary.total}</b>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}

function ScorePill({
  value,
  total,
}: {
  value: number;
  total: number;
}) {
  const percent = percentage(value, total);
  const tone =
    percent === 100
      ? "green"
      : percent >= 50
        ? "blue"
        : percent > 0
          ? "amber"
          : "red";

  return (
    <span className={`proteksi-pill proteksi-pill-${tone}`}>
      {value}/{total}
    </span>
  );
}

function MatrixPanel({
  summaries,
}: {
  summaries: UptSummary[];
}) {
  return (
    <article className="panel proteksi-panel proteksi-wide-panel">
      <div className="proteksi-panel-head">
        <span>
          <strong>Matriks Progress per UPT</strong>
          <small>Realisasi bay LCD untuk setiap indikasi</small>
        </span>
      </div>

      <div className="proteksi-table-scroll">
        <table className="proteksi-matrix-table">
          <thead>
            <tr>
              <th>UPT</th>
              <th>LCD</th>
              <th>FO Fail Ann.</th>
              <th>I Diff Ann.</th>
              <th>FO Fail Dash.</th>
              <th>I Diff Dash.</th>
              <th>Skor</th>
            </tr>
          </thead>
          <tbody>
            {summaries.length === 0 ? (
              <tr>
                <td className="proteksi-table-empty" colSpan={7}>
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              summaries.map((summary) => {
                const score = percentage(
                  summary.ja + summary.jb + summary.jd + summary.je,
                  summary.total * 4,
                );

                return (
                  <tr key={summary.upt}>
                    <td>
                      <i
                        className="proteksi-upt-dot"
                        style={{
                          background:
                            UPT_COLORS[summary.upt] ?? "var(--muted)",
                        }}
                      />
                      <strong>{summary.upt}</strong>
                    </td>
                    <td>{summary.total}</td>
                    <td><ScorePill value={summary.ja} total={summary.total} /></td>
                    <td><ScorePill value={summary.jb} total={summary.total} /></td>
                    <td><ScorePill value={summary.jd} total={summary.total} /></td>
                    <td><ScorePill value={summary.je} total={summary.total} /></td>
                    <td>
                      <span
                        className={`proteksi-pill ${
                          score >= 75
                            ? "proteksi-pill-green"
                            : score >= 50
                              ? "proteksi-pill-blue"
                              : score > 0
                                ? "proteksi-pill-amber"
                                : "proteksi-pill-red"
                        }`}
                      >
                        {score}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function TimelinePanel({
  title,
  subtitle,
  points,
}: {
  title: string;
  subtitle: string;
  points: TimelinePoint[];
}) {
  const maxValue = Math.max(
    1,
    ...points.map((point) => point.actual + point.target),
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
          Tanggal realisasi atau target belum tersedia.
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
                const actualHeight =
                  (point.actual / maxValue) * 100;
                const targetHeight =
                  (point.target / maxValue) * 100;

                return (
                  <div className="proteksi-timeline-column" key={point.key}>
                    <div className="proteksi-timeline-values">
                      <small>
                        {point.actual + point.target || ""}
                      </small>
                      <div>
                        {point.target > 0 && (
                          <i
                            className={`is-target is-${point.targetGroup.replace(
                              "+",
                              "plus",
                            )}`}
                            style={{ height: `${targetHeight}%` }}
                            title={`Target ${point.targetGroup}: ${point.target} bay`}
                          />
                        )}
                        {point.actual > 0 && (
                          <i
                            className="is-actual"
                            style={{ height: `${actualHeight}%` }}
                            title={`Realisasi: ${point.actual} bay`}
                          />
                        )}
                      </div>
                    </div>
                    <b>{point.label}</b>
                    <span>
                      {point.cumulativeActual}/{point.cumulativeAll}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="proteksi-timeline-legend">
            <span><i className="is-actual" />Realisasi</span>
            <span><i className="is-2025" />Target 2025</span>
            <span><i className="is-2026" />Target 2026</span>
            <span><i className="is-2027plus" />Target 2027+</span>
            <small>Kumulatif: realisasi/total rencana</small>
          </div>
        </>
      )}
    </article>
  );
}

export default function ProteksiDashboard() {
  const [records, setRecords] = useState<ProtectionRecord[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uptFilter, setUptFilter] = useState("");
  const [criticalFilter, setCriticalFilter] =
    useState<CriticalFilter>("YA");
  const [relayFilter, setRelayFilter] = useState<RelayFilter>("LCD");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("uptShort");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      setLoadStatus("loading");
      setErrorMessage("");

      try {
        const response = await fetch(CSV_URL, {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            Accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
          },
        });

        if (!response.ok) {
          throw new Error(`Sumber data merespons HTTP ${response.status}.`);
        }

        const parsedRecords = parseProtectionCsv(await response.text());

        if (parsedRecords.length === 0) {
          throw new Error("Data bay tidak ditemukan pada Google Sheets.");
        }

        setRecords(parsedRecords);
        setLastUpdated(new Date());
        setLoadStatus("ready");
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setLoadStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memuat data.",
        );
      }
    };

    void loadData();

    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    uptFilter,
    criticalFilter,
    relayFilter,
    scoreFilter,
    searchQuery,
    sortKey,
    sortDirection,
  ]);

  const uptOptions = useMemo(
    () =>
      [...new Set(records.map((record) => record.uptShort))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right, "id")),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("id-ID");

    return records.filter((record) => {
      if (uptFilter && record.uptShort !== uptFilter) {
        return false;
      }

      if (criticalFilter && record.critical !== criticalFilter) {
        return false;
      }

      if (
        relayFilter === "LCD" &&
        record.relayTypeNormalized !== "LCD"
      ) {
        return false;
      }

      if (
        relayFilter === "Distance" &&
        !record.relayTypeNormalized.includes("DISTANCE")
      ) {
        return false;
      }

      if (scoreFilter !== "" && record.score !== Number(scoreFilter)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        record.uptShort,
        record.ultg,
        record.gi,
        record.bay,
        record.relayType,
      ].some((value) =>
        value.toLocaleLowerCase("id-ID").includes(query),
      );
    });
  }, [
    records,
    uptFilter,
    criticalFilter,
    relayFilter,
    scoreFilter,
    searchQuery,
  ]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];
      const comparison =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue), "id", {
              numeric: true,
              sensitivity: "base",
            });

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredRecords, sortKey, sortDirection]);

  const lcdRecords = useMemo(
    () =>
      filteredRecords.filter(
        (record) => record.relayTypeNormalized === "LCD",
      ),
    [filteredRecords],
  );

  const uptSummaries = useMemo(
    () => getUptSummaries(lcdRecords),
    [lcdRecords],
  );

  const annunciatorTimeline = useMemo(
    () => buildTimeline(lcdRecords, ["ja", "jb"], "jc"),
    [lcdRecords],
  );

  const dashboardTimeline = useMemo(
    () => buildTimeline(lcdRecords, ["jd", "je"], "jf"),
    [lcdRecords],
  );

  const metrics = useMemo(() => {
    const completed = (key: CompletionKey) =>
      lcdRecords.filter((record) => hasValue(record[key])).length;
    const totalLcd = lcdRecords.length;

    return {
      total: filteredRecords.length,
      lcd: totalLcd,
      critical: lcdRecords.filter(
        (record) => record.critical === "YA",
      ).length,
      ja: completed("ja"),
      jb: completed("jb"),
      jd: completed("jd"),
      je: completed("je"),
      score4: lcdRecords.filter((record) => record.score === 4).length,
    };
  }, [filteredRecords, lcdRecords]);

  const progressItems = useMemo<ProgressItem[]>(
    () => [
      {
        label: "FO Fail → Annunciator",
        key: "ja",
        count: metrics.ja,
        percent: percentage(metrics.ja, metrics.lcd),
        tone: "blue",
      },
      {
        label: "I Diff → Annunciator",
        key: "jb",
        count: metrics.jb,
        percent: percentage(metrics.jb, metrics.lcd),
        tone: "red",
      },
      {
        label: "FO Fail → Dashboard",
        key: "jd",
        count: metrics.jd,
        percent: percentage(metrics.jd, metrics.lcd),
        tone: "green",
      },
      {
        label: "I Diff → Dashboard",
        key: "je",
        count: metrics.je,
        percent: percentage(metrics.je, metrics.lcd),
        tone: "violet",
      },
    ],
    [metrics],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(sortedRecords.length / PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pagedRecords = sortedRecords.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

  const resetFilters = () => {
    setUptFilter("");
    setCriticalFilter("");
    setRelayFilter("");
    setScoreFilter("");
    setSearchQuery("");
  };

  const changeSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc",
      );
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) {
      return "⇅";
    }

    return sortDirection === "asc" ? "↑" : "↓";
  };

  const exportFilteredData = () => {
    const headers = [
      "UPT",
      "ULTG",
      "Gardu Induk",
      "Bay",
      "Kritikal",
      "Jenis Relai",
      "FO Fail Annunciator",
      "I Diff Annunciator",
      "FO Fail Dashboard",
      "I Diff Dashboard",
      "Target Annunciator",
      "Target Dashboard",
      "Skor",
    ];
    const rows = sortedRecords.map((record) => [
      record.uptShort,
      record.ultg.replace(/^ULTG\s+/i, ""),
      record.gi,
      record.bay,
      record.critical,
      record.relayType,
      record.ja,
      record.jb,
      record.jd,
      record.je,
      record.jc,
      record.jf,
      `${record.score}/4`,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `monster-proteksi-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const statusLabel =
    loadStatus === "loading"
      ? "Memuat data"
      : loadStatus === "error"
        ? "Data gagal dimuat"
        : `${records.length.toLocaleString("id-ID")} bay dimuat`;

  return (
    <section className="content-view proteksi-native">
      <div className="proteksi-native-toolbar panel">
        <div className="proteksi-native-title">
          <span>
            <ShieldCheck size={20} />
          </span>
          <div>
            <strong>Monitoring Relai LCD — UITJBM</strong>
            <small>
              FO Fail dan I Diff menuju Annunciator, Dashboard, dan EWS
            </small>
          </div>
        </div>

        <div className="proteksi-native-actions">
          <span
            className={`proteksi-data-status is-${loadStatus}`}
            role="status"
          >
            <i />
            {statusLabel}
          </span>
          <button
            className="secondary-action"
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loadStatus === "loading"}
          >
            <RefreshCw
              className={
                loadStatus === "loading" ? "proteksi-spin" : undefined
              }
              size={14}
            />
            Sinkronkan
          </button>
          <a
            className="secondary-action"
            href={SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={14} />
            Buka Spreadsheet
          </a>
        </div>
      </div>

      {loadStatus === "error" && records.length === 0 ? (
        <article className="panel proteksi-error">
          <AlertCircle size={28} />
          <div>
            <strong>Data proteksi belum dapat dimuat</strong>
            <p>{errorMessage}</p>
            <button
              className="primary-action"
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
            >
              <RefreshCw size={14} />
              Coba lagi
            </button>
          </div>
        </article>
      ) : (
        <>
          <article className="panel proteksi-filter-panel">
            <div className="proteksi-search">
              <Search size={14} />
              <input
                value={searchQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Cari UPT, ULTG, gardu induk, atau bay..."
                aria-label="Cari data proteksi"
              />
            </div>

            <select
              value={uptFilter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setUptFilter(event.target.value)
              }
              aria-label="Filter UPT"
            >
              <option value="">Semua UPT</option>
              {uptOptions.map((upt) => (
                <option value={upt} key={upt}>
                  {upt}
                </option>
              ))}
            </select>

            <select
              value={criticalFilter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setCriticalFilter(event.target.value as CriticalFilter)
              }
              aria-label="Filter kritikal"
            >
              <option value="">Semua Kritikal</option>
              <option value="YA">Kritikal (YA)</option>
              <option value="TIDAK">Non Kritikal</option>
            </select>

            <select
              value={relayFilter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setRelayFilter(event.target.value as RelayFilter)
              }
              aria-label="Filter jenis relai"
            >
              <option value="">Semua Jenis Relai</option>
              <option value="LCD">LCD</option>
              <option value="Distance">Distance</option>
            </select>

            <select
              value={scoreFilter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setScoreFilter(event.target.value as ScoreFilter)
              }
              aria-label="Filter skor"
            >
              <option value="">Semua Progress</option>
              <option value="4">Skor 4 — Lengkap</option>
              <option value="3">Skor 3</option>
              <option value="2">Skor 2</option>
              <option value="1">Skor 1</option>
              <option value="0">Skor 0</option>
            </select>

            <button
              className="secondary-action"
              type="button"
              onClick={resetFilters}
            >
              <RotateCcw size={14} />
              Reset
            </button>

            <span className="proteksi-filter-count">
              {filteredRecords.length.toLocaleString("id-ID")} dari{" "}
              {records.length.toLocaleString("id-ID")} baris
            </span>
          </article>

          {loadStatus === "loading" && records.length === 0 ? (
            <article className="panel proteksi-loading">
              <RefreshCw className="proteksi-spin" size={24} />
              <span>
                <strong>Mengambil data Google Sheets</strong>
                <small>Menyiapkan analitik proteksi...</small>
              </span>
            </article>
          ) : (
            <>
              <div className="proteksi-metrics">
                <MetricCard
                  label="Total Bay"
                  value={metrics.total}
                  detail="sesuai filter"
                  tone="blue"
                />
                <MetricCard
                  label="Bay LCD"
                  value={metrics.lcd}
                  detail={`${percentage(metrics.lcd, metrics.total)}% dari total`}
                  tone="blue"
                />
                <MetricCard
                  label="LCD Kritikal"
                  value={metrics.critical}
                  detail={`${percentage(metrics.critical, metrics.lcd)}% dari LCD`}
                  tone="amber"
                />
                <MetricCard
                  label="FO Fail → Ann."
                  value={metrics.ja}
                  detail={`${percentage(metrics.ja, metrics.lcd)}% selesai`}
                  tone="green"
                />
                <MetricCard
                  label="I Diff → Ann."
                  value={metrics.jb}
                  detail={`${percentage(metrics.jb, metrics.lcd)}% selesai`}
                  tone="red"
                />
                <MetricCard
                  label="FO Fail → Dash."
                  value={metrics.jd}
                  detail={`${percentage(metrics.jd, metrics.lcd)}% selesai`}
                  tone="green"
                />
                <MetricCard
                  label="I Diff → Dash."
                  value={metrics.je}
                  detail={`${percentage(metrics.je, metrics.lcd)}% selesai`}
                  tone="violet"
                />
                <MetricCard
                  label="Skor Lengkap"
                  value={metrics.score4}
                  detail={`${percentage(metrics.score4, metrics.lcd)}% skor 4`}
                  tone="cyan"
                />
              </div>

              <div className="proteksi-two-columns">
                <ProgressPanel
                  items={progressItems}
                  total={metrics.lcd}
                />
                <RelayDistribution records={filteredRecords} />
              </div>

              <div className="proteksi-two-columns">
                <UptProgressPanel
                  title="Status Annunciator per UPT"
                  subtitle="FO Fail dan I Diff yang telah ditarik"
                  summaries={uptSummaries}
                  firstKey="ja"
                  secondKey="jb"
                  firstLabel="FO Fail"
                  secondLabel="I Diff"
                />
                <UptProgressPanel
                  title="Status Dashboard & EWS per UPT"
                  subtitle="FO Fail dan I Diff yang telah ditarik"
                  summaries={uptSummaries}
                  firstKey="jd"
                  secondKey="je"
                  firstLabel="FO Fail"
                  secondLabel="I Diff"
                />
              </div>

              <MatrixPanel summaries={uptSummaries} />

              <div className="proteksi-two-columns">
                <TimelinePanel
                  title="Timeline Annunciator"
                  subtitle="Realisasi JA/JB dan target JC per bulan"
                  points={annunciatorTimeline}
                />
                <TimelinePanel
                  title="Timeline Dashboard & EWS"
                  subtitle="Realisasi JD/JE dan target JF per bulan"
                  points={dashboardTimeline}
                />
              </div>

              <article className="panel proteksi-detail-panel">
                <div className="proteksi-detail-head">
                  <span>
                    <strong>Detail Data Bay</strong>
                    <small>
                      Data dapat diurutkan dan diekspor sesuai filter aktif
                    </small>
                  </span>
                  <div>
                    {lastUpdated && (
                      <small>
                        Diperbarui{" "}
                        {new Intl.DateTimeFormat("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(lastUpdated)}
                      </small>
                    )}
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={exportFilteredData}
                      disabled={sortedRecords.length === 0}
                    >
                      <Download size={14} />
                      Ekspor CSV
                    </button>
                  </div>
                </div>

                <div className="proteksi-table-scroll proteksi-detail-scroll">
                  <table className="proteksi-detail-table">
                    <thead>
                      <tr>
                        <th>
                          <button type="button" onClick={() => changeSort("uptShort")}>
                            UPT {sortIndicator("uptShort")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => changeSort("ultg")}>
                            ULTG {sortIndicator("ultg")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => changeSort("gi")}>
                            Gardu Induk {sortIndicator("gi")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => changeSort("bay")}>
                            Bay {sortIndicator("bay")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => changeSort("critical")}>
                            Kritikal {sortIndicator("critical")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => changeSort("relayType")}>
                            Jenis {sortIndicator("relayType")}
                          </button>
                        </th>
                        <th>FO Fail Ann.</th>
                        <th>I Diff Ann.</th>
                        <th>FO Fail Dash.</th>
                        <th>I Diff Dash.</th>
                        <th>Target Ann.</th>
                        <th>Target Dash.</th>
                        <th>
                          <button type="button" onClick={() => changeSort("score")}>
                            Skor {sortIndicator("score")}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRecords.length === 0 ? (
                        <tr>
                          <td className="proteksi-table-empty" colSpan={13}>
                            Tidak ada data yang cocok dengan filter.
                          </td>
                        </tr>
                      ) : (
                        pagedRecords.map((record, index) => (
                          <tr
                            key={`${record.no}-${record.uptShort}-${record.bay}-${index}`}
                          >
                            <td>
                              <i
                                className="proteksi-upt-dot"
                                style={{
                                  background:
                                    UPT_COLORS[record.uptShort] ??
                                    "var(--muted)",
                                }}
                              />
                              <strong>{record.uptShort}</strong>
                            </td>
                            <td>{record.ultg.replace(/^ULTG\s+/i, "") || "—"}</td>
                            <td title={record.gi}>{record.gi || "—"}</td>
                            <td title={record.bay}>{record.bay || "—"}</td>
                            <td>
                              <span
                                className={`proteksi-tag ${
                                  record.critical === "YA"
                                    ? "is-critical"
                                    : "is-neutral"
                                }`}
                              >
                                {record.critical || "—"}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`proteksi-tag ${
                                  record.relayTypeNormalized === "LCD"
                                    ? "is-lcd"
                                    : "is-neutral"
                                }`}
                              >
                                {record.relayType || "—"}
                              </span>
                            </td>
                            <td><CompletionDot value={record.ja} label="FO Fail Annunciator" /></td>
                            <td><CompletionDot value={record.jb} label="I Diff Annunciator" /></td>
                            <td><CompletionDot value={record.jd} label="FO Fail Dashboard" /></td>
                            <td><CompletionDot value={record.je} label="I Diff Dashboard" /></td>
                            <td>{record.jc || "—"}</td>
                            <td>{record.jf || "—"}</td>
                            <td>
                              <span
                                className={`proteksi-score is-${record.score}`}
                                title={[
                                  record.ja || "Belum",
                                  record.jb || "Belum",
                                  record.jd || "Belum",
                                  record.je || "Belum",
                                ].join(" · ")}
                              >
                                {record.score}/4
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="proteksi-pagination">
                  <span>
                    Halaman {safeCurrentPage} dari {pageCount}
                  </span>
                  <div>
                    <button
                      className="secondary-action"
                      type="button"
                      disabled={safeCurrentPage <= 1}
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                    >
                      Sebelumnya
                    </button>
                    <button
                      className="secondary-action"
                      type="button"
                      disabled={safeCurrentPage >= pageCount}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(pageCount, page + 1),
                        )
                      }
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              </article>
            </>
          )}
        </>
      )}
    </section>
  );
}
