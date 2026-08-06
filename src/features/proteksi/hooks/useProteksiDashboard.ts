import { useEffect, useMemo, useState } from "react";
import { PAGE_SIZE } from "../config";
import {
  buildTimeline,
  escapeCsv,
  getUptSummaries,
  hasRealizationDate,
  percentage,
} from "../utils/domain";
import type {
  CompletionKey,
  CriticalFilter,
  DetailColumnFilters,
  DetailFilterOptions,
  ProgressItem,
  RealizationFilter,
  RelayFilter,
  ScoreFilter,
  SortDirection,
  SortKey,
  UpdateDetailColumnFilter,
} from "../types";
import { useProteksiData } from "./useProteksiData";

const EMPTY_DETAIL_FILTERS: DetailColumnFilters = {
  uptShort: "",
  ultg: "",
  gi: "",
  bay: "",
  redundancy: "",
  critical: "",
  relayType: "",
  relayBrand: "",
  relayModel: "",
  jd: "",
  je: "",
  ja: "",
  jb: "",
  score: "",
};

function normalizeSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase("id-ID");
}

function includesFilter(value: string, filter: string): boolean {
  const normalizedFilter = normalizeSearchValue(filter);

  return (
    !normalizedFilter ||
    normalizeSearchValue(value).includes(normalizedFilter)
  );
}

function matchesRealization(
  value: string,
  filter: RealizationFilter,
): boolean {
  if (!filter) {
    return true;
  }

  const completed = hasRealizationDate(value);
  return filter === "complete" ? completed : !completed;
}

function uniqueValues(values: string[]): string[] {
  const displayByKey = new Map<string, string>();

  values.forEach((value) => {
    const display = value.trim().replace(/\s+/g, " ");

    if (!display) {
      return;
    }

    const key = display.toLocaleUpperCase("id-ID");

    if (!displayByKey.has(key)) {
      displayByKey.set(key, display);
    }
  });

  return [...displayByKey.values()].sort((left, right) =>
    left.localeCompare(right, "id", {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

export function useProteksiDashboard() {
  const {
    records,
    loadStatus,
    errorMessage,
    lastUpdated,
    refresh,
  } = useProteksiData();

  const [uptFilter, setUptFilter] = useState("");
  const [criticalFilter, setCriticalFilter] =
    useState<CriticalFilter>("YA");
  const [relayFilter, setRelayFilter] =
    useState<RelayFilter>("LCD");
  const [scoreFilter, setScoreFilter] =
    useState<ScoreFilter>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailFilters, setDetailFilters] =
    useState<DetailColumnFilters>(EMPTY_DETAIL_FILTERS);
  const [sortKey, setSortKey] =
    useState<SortKey>("uptShort");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    uptFilter,
    criticalFilter,
    relayFilter,
    scoreFilter,
    searchQuery,
    detailFilters,
    sortKey,
    sortDirection,
  ]);

  const uptOptions = useMemo(
    () =>
      [...new Set(records.map((record) => record.uptShort))]
        .filter(Boolean)
        .sort((left, right) =>
          left.localeCompare(right, "id"),
        ),
    [records],
  );

  const detailFilterOptions = useMemo<DetailFilterOptions>(
    () => ({
      uptShort: uniqueValues(
        records.map((record) => record.uptShort),
      ),
      relayType: uniqueValues(
        records.map((record) => record.relayType),
      ),
      relayBrand: uniqueValues(
        records.map((record) => record.relayBrand),
      ),
    }),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const query =
      searchQuery.trim().toLocaleLowerCase("id-ID");

    return records.filter((record) => {
      if (
        uptFilter &&
        record.uptShort !== uptFilter
      ) {
        return false;
      }

      if (
        criticalFilter &&
        record.critical !== criticalFilter
      ) {
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

      if (
        scoreFilter !== "" &&
        record.score !== Number(scoreFilter)
      ) {
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

  const detailFilteredRecords = useMemo(
    () =>
      filteredRecords.filter((record) => {
        if (
          detailFilters.uptShort &&
          record.uptShort !== detailFilters.uptShort
        ) {
          return false;
        }

        if (
          !includesFilter(
            record.ultg.replace(/^ULTG\s+/i, ""),
            detailFilters.ultg,
          ) ||
          !includesFilter(record.gi, detailFilters.gi) ||
          !includesFilter(record.bay, detailFilters.bay) ||
          !includesFilter(
            record.redundancy,
            detailFilters.redundancy,
          ) ||
          !includesFilter(
            record.relayModel,
            detailFilters.relayModel,
          )
        ) {
          return false;
        }

        if (
          detailFilters.critical &&
          record.critical !== detailFilters.critical
        ) {
          return false;
        }

        if (
          detailFilters.relayType &&
          record.relayType !== detailFilters.relayType
        ) {
          return false;
        }

        if (
          detailFilters.relayBrand &&
          record.relayBrand !== detailFilters.relayBrand
        ) {
          return false;
        }

        if (
          !matchesRealization(record.jd, detailFilters.jd) ||
          !matchesRealization(record.je, detailFilters.je) ||
          !matchesRealization(record.ja, detailFilters.ja) ||
          !matchesRealization(record.jb, detailFilters.jb)
        ) {
          return false;
        }

        return (
          detailFilters.score === "" ||
          record.score === Number(detailFilters.score)
        );
      }),
    [detailFilters, filteredRecords],
  );

  const sortedRecords = useMemo(() => {
    return [...detailFilteredRecords].sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];
      const comparison =
        typeof leftValue === "number" &&
        typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(
              String(rightValue),
              "id",
              {
                numeric: true,
                sensitivity: "base",
              },
            );

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });
  }, [
    detailFilteredRecords,
    sortKey,
    sortDirection,
  ]);

  const lcdRecords = useMemo(
    () =>
      filteredRecords.filter((record) =>
        record.relayTypeNormalized.includes("LCD"),
      ),
    [filteredRecords],
  );

  const uptSummaries = useMemo(
    () => getUptSummaries(lcdRecords),
    [lcdRecords],
  );

  const annunciatorTimeline = useMemo(
    () =>
      buildTimeline(
        lcdRecords,
        "targetAnnunciator",
        "ja",
        "jb",
      ),
    [lcdRecords],
  );

  const dashboardTimeline = useMemo(
    () =>
      buildTimeline(
        lcdRecords,
        "targetDashboard",
        "jd",
        "je",
      ),
    [lcdRecords],
  );

  const metrics = useMemo(() => {
    const completed = (key: CompletionKey) =>
      lcdRecords.filter((record) =>
        hasRealizationDate(record[key]),
      ).length;
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
      score4: lcdRecords.filter(
        (record) => record.score === 4,
      ).length,
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
  const safeCurrentPage = Math.min(
    currentPage,
    pageCount,
  );
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

  const updateDetailFilter: UpdateDetailColumnFilter = (
    key,
    value,
  ) => {
    setDetailFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetDetailFilters = () => {
    setDetailFilters(EMPTY_DETAIL_FILTERS);
  };

  const hasActiveDetailFilters = Object.values(
    detailFilters,
  ).some(Boolean);

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

  const previousPage = () => {
    setCurrentPage((page) =>
      Math.max(1, page - 1),
    );
  };

  const nextPage = () => {
    setCurrentPage((page) =>
      Math.min(pageCount, page + 1),
    );
  };

  return {
    records,
    loadStatus,
    errorMessage,
    lastUpdated,
    refresh,
    statusLabel,
    uptFilter,
    setUptFilter,
    criticalFilter,
    setCriticalFilter,
    relayFilter,
    setRelayFilter,
    scoreFilter,
    setScoreFilter,
    searchQuery,
    setSearchQuery,
    uptOptions,
    filteredRecords,
    detailFilteredRecords,
    detailFilters,
    detailFilterOptions,
    updateDetailFilter,
    resetDetailFilters,
    hasActiveDetailFilters,
    sortedRecords,
    pagedRecords,
    sortKey,
    sortDirection,
    changeSort,
    resetFilters,
    metrics,
    progressItems,
    uptSummaries,
    annunciatorTimeline,
    dashboardTimeline,
    safeCurrentPage,
    pageCount,
    previousPage,
    nextPage,
    exportFilteredData,
  };
}
