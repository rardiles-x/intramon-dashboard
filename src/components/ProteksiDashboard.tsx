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
  | "redundancy"
  | "critical"
  | "relayType"
  | "relayBrand"
  | "relayModel"
  | "ja"
  | "jb"
  | "jd"
  | "je";

type ColumnMap = Record<SourceColumnKey, number>;

/**
 * Pemetaan sumber resmi, indeks berbasis nol:
 * A=0, C=2, D=3, E=4, F=5, I=8, L=11, M=12,
 * N=13, O=14, R=17, U=20, Y=24, AB=27.
 *
 * ja = FO Fail ke Annunciator (Y)
 * jb = Diff Alarm/Spv ke Annunciator (AB)
 * jd = FO Fail ke Dashboard & EWS (R)
 * je = Diff Alarm/Spv ke Dashboard & EWS (U)
 */
const SOURCE_COLUMN_INDEX: ColumnMap = {
  no: 0,
  upt: 2,
  ultg: 3,
  gi: 4,
  bay: 5,
  redundancy: 8,
  critical: 11,
  relayType: 12,
  relayBrand: 13,
  relayModel: 14,
  jd: 17,
  je: 20,
  ja: 24,
  jb: 27,
};

const COLUMN_REFERENCES: Record<SourceColumnKey, string> = {
  no: "A",
  upt: "C",
  ultg: "D",
  gi: "E",
  bay: "F",
  redundancy: "I",
  critical: "L",
  relayType: "M",
  relayBrand: "N",
  relayModel: "O",
  jd: "R",
  je: "U",
  ja: "Y",
  jb: "AB",
};

const HEADER_SEARCH_LIMIT = 40;


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
type SortKey =
  | "uptShort"
  | "ultg"
  | "gi"
  | "bay"
  | "redundancy"
  | "critical"
  | "relayType"
  | "relayBrand"
  | "relayModel"
  | "score";
type SortDirection = "asc" | "desc";

type ProtectionRecord = {
  no: string;
  upt: string;
  uptShort: string;
  ultg: string;
  gi: string;
  bay: string;
  redundancy: string;
  critical: string;
  relayType: string;
  relayTypeNormalized: string;
  relayBrand: string;
  relayModel: string;
  ja: string;
  jb: string;
  jd: string;
  je: string;
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
  first: number;
  second: number;
  cumulativeFirst: number;
  cumulativeSecond: number;
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

const hasRealizationDate = (value: string) =>
  parseDateValue(value) !== null;

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

function parseProtectionCsv(text: string): ProtectionRecord[] {
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

  if (!parsed) {
    return null;
  }

  return {
    year: parsed.year,
    month: parsed.month,
    key: parsed.key,
    label: parsed.label,
  };
}

function formatRealizationDate(value: string) {
  return parseDateValue(value)?.display ?? "Belum";
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

function buildTimeline(
  records: ProtectionRecord[],
  firstKey: CompletionKey,
  secondKey: CompletionKey,
): TimelinePoint[] {
  const first = new Map<string, number>();
  const second = new Map<string, number>();
  const labels = new Map<string, string>();

  for (const record of records) {
    const firstDate = parseYearMonth(record[firstKey]);
    const secondDate = parseYearMonth(record[secondKey]);

    if (firstDate) {
      labels.set(firstDate.key, firstDate.label);
      first.set(
        firstDate.key,
        (first.get(firstDate.key) ?? 0) + 1,
      );
    }

    if (secondDate) {
      labels.set(secondDate.key, secondDate.label);
      second.set(
        secondDate.key,
        (second.get(secondDate.key) ?? 0) + 1,
      );
    }
  }

  const keys = [
    ...new Set([...first.keys(), ...second.keys()]),
  ].sort();

  let cumulativeFirst = 0;
  let cumulativeSecond = 0;

  return keys.map((key) => {
    const firstValue = first.get(key) ?? 0;
    const secondValue = second.get(key) ?? 0;

    cumulativeFirst += firstValue;
    cumulativeSecond += secondValue;

    return {
      key,
      label: labels.get(key) ?? key,
      first: firstValue,
      second: secondValue,
      cumulativeFirst,
      cumulativeSecond,
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

function CompletionDate({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const completed = hasRealizationDate(value);
  const display = formatRealizationDate(value);

  return (
    <span
      className={`proteksi-completion ${
        completed ? "is-complete" : "is-incomplete"
      }`}
      title={
        completed
          ? `${label}: ${value}`
          : `${label}: belum terealisasi`
      }
      aria-label={
        completed
          ? `${label} terealisasi ${display}`
          : `${label} belum terealisasi`
      }
    >
      {completed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      <small>{display}</small>
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
      (record) => record.relayTypeNormalized.includes("LCD"),
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
              <th>Diff Ann.</th>
              <th>FO Fail Dash/EWS</th>
              <th>Diff Dash/EWS</th>
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
  firstLabel,
  secondLabel,
}: {
  title: string;
  subtitle: string;
  points: TimelinePoint[];
  firstLabel: string;
  secondLabel: string;
}) {
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
        !record.relayTypeNormalized.includes("LCD")
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
        record.redundancy,
        record.relayType,
        record.relayBrand,
        record.relayModel,
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
        (record) => record.relayTypeNormalized.includes("LCD"),
      ),
    [filteredRecords],
  );

  const uptSummaries = useMemo(
    () => getUptSummaries(lcdRecords),
    [lcdRecords],
  );

  const annunciatorTimeline = useMemo(
    () => buildTimeline(lcdRecords, "ja", "jb"),
    [lcdRecords],
  );

  const dashboardTimeline = useMemo(
    () => buildTimeline(lcdRecords, "jd", "je"),
    [lcdRecords],
  );

  const metrics = useMemo(() => {
    const completed = (key: CompletionKey) =>
      lcdRecords.filter((record) => hasRealizationDate(record[key])).length;
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
        label: "Diff Alarm/Spv → Annunciator",
        key: "jb",
        count: metrics.jb,
        percent: percentage(metrics.jb, metrics.lcd),
        tone: "red",
      },
      {
        label: "FO Fail → Dashboard & EWS",
        key: "jd",
        count: metrics.jd,
        percent: percentage(metrics.jd, metrics.lcd),
        tone: "green",
      },
      {
        label: "Diff Alarm/Spv → Dashboard & EWS",
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
      "UPT (C)",
      "ULTG (D)",
      "GI/GIS (E)",
      "Bay (F)",
      "GI-Bay-Redundant (I)",
      "Kritikal UIP2B ABO 2026 (L)",
      "Jenis Relay (M)",
      "Merk MPU (N)",
      "Tipe MPU (O)",
      "Realisasi FO Fail Dashboard & EWS (R)",
      "Realisasi Diff Alarm/Spv Dashboard & EWS (U)",
      "Realisasi FO Fail Annunciator (Y)",
      "Realisasi Diff Alarm/Spv Annunciator (AB)",
      "Skor",
    ];
    const rows = sortedRecords.map((record) => [
      record.uptShort,
      record.ultg.replace(/^ULTG\s+/i, ""),
      record.gi,
      record.bay,
      record.redundancy,
      record.critical,
      record.relayType,
      record.relayBrand,
      record.relayModel,
      record.jd,
      record.je,
      record.ja,
      record.jb,
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
              Realisasi FO Fail dan Diff Alarm/Spv menuju Annunciator, Dashboard, dan EWS
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
                placeholder="Cari UPT, ULTG, GI/GIS, bay, redundant, merk, atau tipe MPU..."
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
                  label="Diff → Ann."
                  value={metrics.jb}
                  detail={`${percentage(metrics.jb, metrics.lcd)}% selesai`}
                  tone="red"
                />
                <MetricCard
                  label="FO Fail → Dash/EWS"
                  value={metrics.jd}
                  detail={`${percentage(metrics.jd, metrics.lcd)}% selesai`}
                  tone="green"
                />
                <MetricCard
                  label="Diff → Dash/EWS"
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
                  subtitle="Realisasi tanggal FO Fail dan Diff Alarm/Spv"
                  summaries={uptSummaries}
                  firstKey="ja"
                  secondKey="jb"
                  firstLabel="FO Fail"
                  secondLabel="Diff Alarm/Spv"
                />
                <UptProgressPanel
                  title="Status Dashboard & EWS per UPT"
                  subtitle="Realisasi tanggal FO Fail dan Diff Alarm/Spv"
                  summaries={uptSummaries}
                  firstKey="jd"
                  secondKey="je"
                  firstLabel="FO Fail"
                  secondLabel="Diff Alarm/Spv"
                />
              </div>

              <MatrixPanel summaries={uptSummaries} />

              <div className="proteksi-two-columns">
                <TimelinePanel
                  title="Timeline Annunciator"
                  subtitle="Tanggal realisasi kolom Y dan AB per bulan"
                  points={annunciatorTimeline}
                  firstLabel="FO Fail (Y)"
                  secondLabel="Diff Alarm/Spv (AB)"
                />
                <TimelinePanel
                  title="Timeline Dashboard & EWS"
                  subtitle="Tanggal realisasi kolom R dan U per bulan"
                  points={dashboardTimeline}
                  firstLabel="FO Fail (R)"
                  secondLabel="Diff Alarm/Spv (U)"
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
                            GI/GIS {sortIndicator("gi")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => changeSort("bay")}>
                            Bay {sortIndicator("bay")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => changeSort("redundancy")}>
                            GI-Bay-Redundant {sortIndicator("redundancy")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => changeSort("critical")}>
                            Kritikal {sortIndicator("critical")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => changeSort("relayType")}>
                            Jenis Relay {sortIndicator("relayType")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => changeSort("relayBrand")}>
                            Merk MPU {sortIndicator("relayBrand")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => changeSort("relayModel")}>
                            Tipe MPU {sortIndicator("relayModel")}
                          </button>
                        </th>
                        <th>FO Fail Dash/EWS (R)</th>
                        <th>Diff Dash/EWS (U)</th>
                        <th>FO Fail Ann. (Y)</th>
                        <th>Diff Ann. (AB)</th>
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
                          <td className="proteksi-table-empty" colSpan={14}>
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
                            <td title={record.redundancy}>
                              {record.redundancy || "—"}
                            </td>
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
                                  record.relayTypeNormalized.includes("LCD")
                                    ? "is-lcd"
                                    : "is-neutral"
                                }`}
                              >
                                {record.relayType || "—"}
                              </span>
                            </td>
                            <td title={record.relayBrand}>
                              {record.relayBrand || "—"}
                            </td>
                            <td title={record.relayModel}>
                              {record.relayModel || "—"}
                            </td>
                            <td>
                              <CompletionDate
                                value={record.jd}
                                label="FO Fail Dashboard & EWS"
                              />
                            </td>
                            <td>
                              <CompletionDate
                                value={record.je}
                                label="Diff Alarm/Spv Dashboard & EWS"
                              />
                            </td>
                            <td>
                              <CompletionDate
                                value={record.ja}
                                label="FO Fail Annunciator"
                              />
                            </td>
                            <td>
                              <CompletionDate
                                value={record.jb}
                                label="Diff Alarm/Spv Annunciator"
                              />
                            </td>
                            <td>
                              <span
                                className={`proteksi-score is-${record.score}`}
                                title={[
                                  `R: ${formatRealizationDate(record.jd)}`,
                                  `U: ${formatRealizationDate(record.je)}`,
                                  `Y: ${formatRealizationDate(record.ja)}`,
                                  `AB: ${formatRealizationDate(record.jb)}`,
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
