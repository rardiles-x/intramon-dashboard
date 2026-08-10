import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  THREE_V0_PUBLISHED_CSV_URL,
} from "../config";
import {
  parseFullThreeV0Csv,
} from "../utils";
import type {
  ThreeV0LoadStatus,
  ThreeV0Record,
} from "../types";

const SOURCE_LABEL =
  "Google Sheets · Published CSV";

export function useThreeV0Data() {
  const [records, setRecords] = useState<
    ThreeV0Record[]
  >([]);

  const [
    loadStatus,
    setLoadStatus,
  ] = useState<ThreeV0LoadStatus>(
    "loading",
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState<Date | null>(null);

  const [
    sourceLabel,
    setSourceLabel,
  ] = useState("");

  const [refreshKey, setRefreshKey] =
    useState(0);

  const loadData = useCallback(
    async (signal: AbortSignal) => {
      setLoadStatus("loading");
      setErrorMessage("");

      try {
        const response = await fetch(
          THREE_V0_PUBLISHED_CSV_URL,
          {
            cache: "no-store",
            signal,
            headers: {
              Accept:
                "text/csv,text/plain;q=0.9,*/*;q=0.8",
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`,
          );
        }

        const text = await response.text();

        if (
          text
            .trimStart()
            .startsWith("<")
        ) {
          throw new Error(
            "respons Google bukan CSV",
          );
        }

        const parsed =
          parseFullThreeV0Csv(text);

        if (parsed.length === 0) {
          throw new Error(
            "data Bay / Trafo tidak ditemukan",
          );
        }

        setRecords(parsed);
        setLastUpdated(new Date());
        setSourceLabel(SOURCE_LABEL);
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
          "Published CSV Monitoring 3V0 belum dapat dibaca. " +
            "Pastikan File → Share → Publish to web masih aktif " +
            "dan format publikasi adalah CSV. Detail: " +
            (
              error instanceof Error
                ? error.message
                : "gagal membaca data"
            ),
        );
      }
    },
    [],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    void loadData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadData, refreshKey]);

  return {
    records,
    loadStatus,
    errorMessage,
    lastUpdated,
    sourceLabel,
    refresh: () =>
      setRefreshKey((value) => value + 1),
  };
}
