export type SourceColumnKey =
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
  | "targetAnnunciator"
  | "targetDashboard"
  | "ja"
  | "jb"
  | "jd"
  | "je";

export type ColumnMap = Record<SourceColumnKey, number>;

export type LoadStatus = "loading" | "ready" | "error";
export type CriticalFilter = "" | "YA" | "TIDAK";
export type RelayFilter = "" | "LCD" | "Distance";
export type ScoreFilter = "" | "0" | "1" | "2" | "3" | "4";
export type CompletionKey = "ja" | "jb" | "jd" | "je";
export type TimelineDateKey =
  | "targetAnnunciator"
  | "targetDashboard"
  | CompletionKey;

export type SortKey =
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

export type SortDirection = "asc" | "desc";

export type ProtectionRecord = {
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
  targetAnnunciator: string;
  targetDashboard: string;
  ja: string;
  jb: string;
  jd: string;
  je: string;
  score: number;
};

export type UptSummary = {
  upt: string;
  total: number;
  ja: number;
  jb: number;
  jd: number;
  je: number;
  score4: number;
};

export type TimelinePoint = {
  key: string;
  label: string;
  target: number;
  first: number;
  second: number;
  cumulativeTarget: number;
  cumulativeFirst: number;
  cumulativeSecond: number;
};

export type MetricTone =
  | "blue"
  | "amber"
  | "green"
  | "red"
  | "violet"
  | "cyan";

export type ProgressItem = {
  label: string;
  key: CompletionKey;
  count: number;
  percent: number;
  tone: "blue" | "red" | "green" | "violet";
};

export type ProteksiMetrics = {
  total: number;
  lcd: number;
  critical: number;
  ja: number;
  jb: number;
  jd: number;
  je: number;
  score4: number;
};

export type RealizationFilter = "" | "complete" | "incomplete";

export type DetailColumnFilters = {
  uptShort: string;
  ultg: string;
  gi: string;
  bay: string;
  redundancy: string;
  critical: string;
  relayType: string;
  relayBrand: string;
  relayModel: string;
  jd: RealizationFilter;
  je: RealizationFilter;
  ja: RealizationFilter;
  jb: RealizationFilter;
  score: ScoreFilter;
};

export type DetailFilterOptions = {
  uptShort: string[];
  relayType: string[];
  relayBrand: string[];
};

export type UpdateDetailColumnFilter = <
  Key extends keyof DetailColumnFilters,
>(
  key: Key,
  value: DetailColumnFilters[Key],
) => void;
