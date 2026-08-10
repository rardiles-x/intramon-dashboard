export type ThreeV0LoadStatus =
  | "loading"
  | "ready"
  | "error";

export type ThreeV0ProgressStatus =
  | "complete"
  | "partial"
  | "pending";

export type ThreeV0Record = {
  id: string;
  upt: string;
  ultg: string;
  gi: string;
  bay: string;
  sbefModel: string;
  analogStatus: string;
  analogTarget: string;
  analogRealization: string;
  alarmStatus: string;
  alarmTarget: string;
  alarmRealization: string;
  sbefConfiguration: string;
  status: ThreeV0ProgressStatus;
};

export type ThreeV0SortKey =
  | "upt"
  | "ultg"
  | "gi"
  | "bay"
  | "sbefModel"
  | "analogStatus"
  | "analogTarget"
  | "analogRealization"
  | "alarmStatus"
  | "alarmTarget"
  | "alarmRealization"
  | "sbefConfiguration";

export type ThreeV0SortDirection =
  | "asc"
  | "desc";

export type ThreeV0Metrics = {
  total: number;
  analogRealized: number;
  alarmRealized: number;
  complete: number;
  partial: number;
  pending: number;
  progress: number;
};

export type ThreeV0UptSummary = {
  upt: string;
  total: number;
  analogRealized: number;
  alarmRealized: number;
  complete: number;
};

export type ThreeV0MonthPoint = {
  month: number;
  label: string;
  target: number;
  realized: number;
};

export type ThreeV0BayProgress = {
  bay: string;
  analogRealization: string;
  alarmRealization: string;
  status: ThreeV0ProgressStatus;
};

export type ThreeV0GiNode = {
  id: string;
  gi: string;
  upt: string;
  ultg: string;
  latitude: number;
  longitude: number;
  precision: "manual" | "exact" | "approximate";
  locationLabel: string;
  status: ThreeV0ProgressStatus;
  totalBay: number;
  analogRealized: number;
  alarmRealized: number;
  completeBay: number;
  progress: number;
  bays: ThreeV0BayProgress[];
};

export type ThreeV0GiMapResult = {
  nodes: ThreeV0GiNode[];
  unresolvedGi: string[];
};
