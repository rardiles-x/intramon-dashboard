import type { ColumnMap, SourceColumnKey } from "./types";

export const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTF582KzohQo5LW0gWLPiK60V-bHmBWQ_EZ3mxYPkf8m5oalArzAo78jKttHAnHZTlEGRGhoUZkmJ5q/pub?gid=855839774&single=true&output=csv";

export const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1l3dyT_K1SlvOARCLtm6r3KgEz_eNzaMm67tocnY574g/edit?gid=855839774#gid=855839774";

export const PAGE_SIZE = 25;

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
export const SOURCE_COLUMN_INDEX: ColumnMap = {
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

export const COLUMN_REFERENCES: Record<SourceColumnKey, string> = {
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

export const HEADER_SEARCH_LIMIT = 40;

export const MONTHS: Record<string, number> = {
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

export const MONTH_LABELS = [
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

export const UPT_COLORS: Record<string, string> = {
  BALI: "#2563eb",
  GRESIK: "#16a34a",
  MADIUN: "#d97706",
  MALANG: "#7c3aed",
  PROBOLINGGO: "#dc2626",
  SURABAYA: "#0891b2",
};
