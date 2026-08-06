import { useEffect, useState } from "react";
import { CSV_URL } from "../config";
import { parseProtectionCsv } from "../utils/domain";
import type { LoadStatus, ProtectionRecord } from "../types";

export function useProteksiData() {
  const [records, setRecords] = useState<ProtectionRecord[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const refresh = () => {
    setRefreshKey((value) => value + 1);
  };

  return {
    records,
    loadStatus,
    errorMessage,
    lastUpdated,
    refresh,
  };
}
