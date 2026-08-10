import "../../components/ProteksiDashboard.css";
import "./ThreeV0Dashboard.css";
import {
  CircleAlert,
  FileSpreadsheet,
  Gauge,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  THREE_V0_PAGE_SIZE,
  THREE_V0_SPREADSHEET_URL,
} from "./config";
import {
  ThreeV0MetricsGrid,
  ThreeV0ProgressPanel,
  ThreeV0StatusDistribution,
  ThreeV0TimelinePanel,
  ThreeV0UptProgress,
} from "./components/ThreeV0Panels";
import { ThreeV0DetailTable } from "./components/ThreeV0Table";
import { ThreeV0Map } from "./components/ThreeV0Map";
import { useThreeV0Data } from "./hooks/useThreeV0Data";
import type {
  ThreeV0ProgressStatus,
  ThreeV0SortDirection,
  ThreeV0SortKey,
} from "./types";
import {
  buildMonthTimeline,
  escapeCsv,
  getThreeV0Metrics,
  getThreeV0UptSummaries,
  uniqueValues,
} from "./utils";

type StatusFilter =
  | ""
  | ThreeV0ProgressStatus;

const STATUS_OPTIONS = [
  ["", "Semua status"],
  ["complete", "Selesai"],
  ["partial", "Sebagian"],
  ["pending", "Belum"],
] as const;

function normalizeSearch(
  value: string,
): string {
  return value
    .trim()
    .toLocaleLowerCase("id-ID");
}

export default function ThreeV0Dashboard() {
  const data = useThreeV0Data();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [uptFilter, setUptFilter] =
    useState("");

  const [ultgFilter, setUltgFilter] =
    useState("");

  const [giFilter, setGiFilter] =
    useState("");

  const [bayFilter, setBayFilter] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>("");

  const [sortKey, setSortKey] =
    useState<ThreeV0SortKey>("upt");

  const [
    sortDirection,
    setSortDirection,
  ] =
    useState<ThreeV0SortDirection>(
      "asc",
    );

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const uptOptions = useMemo(
    () =>
      uniqueValues(
        data.records.map(
          (record) => record.upt,
        ),
      ),
    [data.records],
  );

  const ultgOptions = useMemo(
    () =>
      uniqueValues(
        data.records
          .filter(
            (record) =>
              !uptFilter ||
              record.upt === uptFilter,
          )
          .map(
            (record) =>
              record.ultg,
          ),
      ),
    [data.records, uptFilter],
  );

  const giOptions = useMemo(
    () =>
      uniqueValues(
        data.records
          .filter(
            (record) =>
              (!uptFilter ||
                record.upt ===
                  uptFilter) &&
              (!ultgFilter ||
                record.ultg ===
                  ultgFilter),
          )
          .map(
            (record) =>
              record.gi,
          ),
      ),
    [
      data.records,
      uptFilter,
      ultgFilter,
    ],
  );

  const bayOptions = useMemo(
    () =>
      uniqueValues(
        data.records
          .filter(
            (record) =>
              (!uptFilter ||
                record.upt ===
                  uptFilter) &&
              (!ultgFilter ||
                record.ultg ===
                  ultgFilter) &&
              (!giFilter ||
                record.gi ===
                  giFilter),
          )
          .map(
            (record) =>
              record.bay,
          ),
      ),
    [
      data.records,
      uptFilter,
      ultgFilter,
      giFilter,
    ],
  );

  const filteredRecords =
    useMemo(() => {
      const query =
        normalizeSearch(
          searchQuery,
        );

      return data.records.filter(
        (record) => {
          if (
            uptFilter &&
            record.upt !== uptFilter
          ) {
            return false;
          }

          if (
            ultgFilter &&
            record.ultg !== ultgFilter
          ) {
            return false;
          }

          if (
            giFilter &&
            record.gi !== giFilter
          ) {
            return false;
          }

          if (
            bayFilter &&
            record.bay !== bayFilter
          ) {
            return false;
          }

          if (
            statusFilter &&
            record.status !==
              statusFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            record.upt,
            record.ultg,
            record.gi,
            record.bay,
            record.sbefModel,
            record.analogStatus,
            record.analogTarget,
            record.analogRealization,
            record.alarmStatus,
            record.alarmTarget,
            record.alarmRealization,
            record.sbefConfiguration,
          ]
            .join(" ")
            .toLocaleLowerCase(
              "id-ID",
            )
            .includes(query);
        },
      );
    }, [
      data.records,
      uptFilter,
      ultgFilter,
      giFilter,
      bayFilter,
      statusFilter,
      searchQuery,
    ]);

  const sortedRecords = useMemo(
    () =>
      [...filteredRecords].sort(
        (left, right) => {
          const comparison = String(
            left[sortKey] ?? "",
          ).localeCompare(
            String(
              right[sortKey] ?? "",
            ),
            "id",
            {
              numeric: true,
              sensitivity: "base",
            },
          );

          return sortDirection ===
            "asc"
            ? comparison
            : -comparison;
        },
      ),
    [
      filteredRecords,
      sortKey,
      sortDirection,
    ],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(
      sortedRecords.length /
        THREE_V0_PAGE_SIZE,
    ),
  );

  const safeCurrentPage = Math.min(
    currentPage,
    pageCount,
  );

  const pagedRecords =
    sortedRecords.slice(
      (safeCurrentPage - 1) *
        THREE_V0_PAGE_SIZE,
      safeCurrentPage *
        THREE_V0_PAGE_SIZE,
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    uptFilter,
    ultgFilter,
    giFilter,
    bayFilter,
    statusFilter,
    searchQuery,
    sortKey,
    sortDirection,
  ]);

  const metrics = useMemo(
    () =>
      getThreeV0Metrics(
        filteredRecords,
      ),
    [filteredRecords],
  );

  const uptSummaries = useMemo(
    () =>
      getThreeV0UptSummaries(
        filteredRecords,
      ),
    [filteredRecords],
  );

  const analogTimeline = useMemo(
    () =>
      buildMonthTimeline(
        filteredRecords,
        "analogTarget",
        "analogRealization",
      ),
    [filteredRecords],
  );

  const alarmTimeline = useMemo(
    () =>
      buildMonthTimeline(
        filteredRecords,
        "alarmTarget",
        "alarmRealization",
      ),
    [filteredRecords],
  );

  const resetFilters = () => {
    setSearchQuery("");
    setUptFilter("");
    setUltgFilter("");
    setGiFilter("");
    setBayFilter("");
    setStatusFilter("");
  };

  const changeSort = (
    key: ThreeV0SortKey,
  ) => {
    if (sortKey === key) {
      setSortDirection(
        (direction) =>
          direction === "asc"
            ? "desc"
            : "asc",
      );
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  const exportFiltered = () => {
    const headers = [
      "UPT",
      "ULTG",
      "GI",
      "Bay",
      "MERK DAN TIPE SBEF",
      "Status Penarikan Analog Tegangan",
      "Target Penarikan Analog Tegangan",
      "Realisasi Analog Tegangan LV",
      "Aktivasi 3V0 untuk Alarm",
      "Target Aktivasi 3V0 untuk Alarm",
      "Realisasi Alarm 3V0",
      "SBEF Terpisah / Gabung OCR HV / LV",
    ];

    const rows =
      sortedRecords.map(
        (record) => [
          record.upt,
          record.ultg,
          record.gi,
          record.bay,
          record.sbefModel,
          record.analogStatus,
          record.analogTarget,
          record.analogRealization,
          record.alarmStatus,
          record.alarmTarget,
          record.alarmRealization,
          record.sbefConfiguration,
        ],
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(escapeCsv)
          .join(","),
      )
      .join("\r\n");

    const blob = new Blob(
      [`\uFEFF${csv}`],
      {
        type:
          "text/csv;charset=utf-8",
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `monster-monitoring-3v0-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(
      link,
    );

    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const statusLabel =
    data.loadStatus === "loading"
      ? "Memuat data 3V0"
      : data.loadStatus === "error"
        ? "Sumber data bermasalah"
        : `${data.records.length.toLocaleString(
            "id-ID",
          )} Bay / Trafo dimuat`;

  return (
    <section className="content-view proteksi-native threev0-native">
      <article className="panel proteksi-native-toolbar">
        <div className="proteksi-native-title">
          <span>
            <Gauge size={20} />
          </span>

          <div>
            <strong>
              Status Implementasi
            </strong>
            <small>
              Penarikan Analog Tegangan dan Aktivasi 3V0 untuk Alarm
            </small>
          </div>
        </div>

        <div className="proteksi-native-actions">
          <span
            className={
              `proteksi-data-status ` +
              `is-${data.loadStatus}`
            }
          >
            <i />
            {statusLabel}
          </span>

          <a
            className="secondary-action"
            href={
              THREE_V0_SPREADSHEET_URL
            }
            target="_blank"
            rel="noreferrer"
          >
            <FileSpreadsheet
              size={14}
            />
            Spreadsheet
          </a>

          <button
            className="primary-action"
            type="button"
            onClick={data.refresh}
            disabled={
              data.loadStatus ===
              "loading"
            }
          >
            <RefreshCw
              size={14}
              className={
                data.loadStatus ===
                "loading"
                  ? "spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>
      </article>

      <article className="panel proteksi-filter-panel threev0-filter-panel">
        <label className="proteksi-search">
          <Search size={14} />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value,
              )
            }
            placeholder="Cari GI, Bay, SBEF, status..."
            aria-label="Cari data Monitoring 3V0"
          />
        </label>

        <select
          value={uptFilter}
          onChange={(event) => {
            setUptFilter(
              event.target.value,
            );
            setUltgFilter("");
            setGiFilter("");
            setBayFilter("");
          }}
          aria-label="Filter UPT"
        >
          <option value="">
            Semua UPT
          </option>
          {uptOptions.map((value) => (
            <option
              key={value}
              value={value}
            >
              {value}
            </option>
          ))}
        </select>

        <select
          value={ultgFilter}
          onChange={(event) => {
            setUltgFilter(
              event.target.value,
            );
            setGiFilter("");
            setBayFilter("");
          }}
          aria-label="Filter ULTG"
        >
          <option value="">
            Semua ULTG
          </option>
          {ultgOptions.map((value) => (
            <option
              key={value}
              value={value}
            >
              {value}
            </option>
          ))}
        </select>

        <select
          value={giFilter}
          onChange={(event) => {
            setGiFilter(
              event.target.value,
            );
            setBayFilter("");
          }}
          aria-label="Filter Gardu Induk"
        >
          <option value="">
            Semua GI
          </option>
          {giOptions.map((value) => (
            <option
              key={value}
              value={value}
            >
              {value}
            </option>
          ))}
        </select>

        <select
          value={bayFilter}
          onChange={(event) =>
            setBayFilter(
              event.target.value,
            )
          }
          aria-label="Filter Bay"
        >
          <option value="">
            Semua Bay
          </option>
          {bayOptions.map((value) => (
            <option
              key={value}
              value={value}
            >
              {value}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target
                .value as StatusFilter,
            )
          }
          aria-label="Filter status realisasi"
        >
          {STATUS_OPTIONS.map(
            ([value, label]) => (
              <option
                key={
                  value || "all"
                }
                value={value}
              >
                {label}
              </option>
            ),
          )}
        </select>

        <button
          className="secondary-action"
          type="button"
          onClick={resetFilters}
        >
          <X size={13} />
          Reset
        </button>

        <span className="proteksi-filter-count">
          {filteredRecords.length.toLocaleString(
            "id-ID",
          )}
          /
          {data.records.length.toLocaleString(
            "id-ID",
          )}{" "}
          baris
        </span>
      </article>

      {data.loadStatus === "error" &&
      data.records.length === 0 ? (
        <article className="panel proteksi-error">
          <CircleAlert size={28} />
          <div>
            <strong>
              Data 3V0 gagal dimuat
            </strong>
            <p>
              {data.errorMessage}
            </p>
            <button
              className="primary-action"
              type="button"
              onClick={data.refresh}
            >
              Coba lagi
            </button>
          </div>
        </article>
      ) : data.loadStatus ===
          "loading" &&
        data.records.length === 0 ? (
        <article className="panel proteksi-loading">
          <RefreshCw
            className="spin"
            size={26}
          />
          <span>
            <strong>
              Memuat Monitoring 3V0
            </strong>
            <small>
              Membaca kolom B, C, D, E,
              AO–AV dari Google Sheets.
            </small>
          </span>
        </article>
      ) : (
        <>
          <ThreeV0MetricsGrid
            metrics={metrics}
          />

          <ThreeV0ProgressPanel
            metrics={metrics}
          />

          <div className="proteksi-two-columns">
            <ThreeV0StatusDistribution
              metrics={metrics}
            />

            <ThreeV0UptProgress
              summaries={
                uptSummaries
              }
            />
          </div>

          <ThreeV0Map
            records={data.records}
          />

          <div className="proteksi-two-columns">
            <ThreeV0TimelinePanel
              title="Timeline Penarikan Analog Tegangan"
              subtitle="Target dan Realisasi Penarikan Analog Tegangan per bulan"
              points={analogTimeline}
            />

            <ThreeV0TimelinePanel
              title="Timeline Aktivasi 3V0 untuk Alarm"
              subtitle="Target dan Realisasi Aktivasi 3V0 Alarm per bulan"
              points={alarmTimeline}
            />
          </div>

          <ThreeV0DetailTable
            records={pagedRecords}
            filteredCount={
              filteredRecords.length
            }
            totalCount={
              data.records.length
            }
            sortKey={sortKey}
            sortDirection={
              sortDirection
            }
            onSort={changeSort}
            onExport={exportFiltered}
            currentPage={
              safeCurrentPage
            }
            pageCount={pageCount}
            onPreviousPage={() =>
              setCurrentPage(
                (page) =>
                  Math.max(
                    1,
                    page - 1,
                  ),
              )
            }
            onNextPage={() =>
              setCurrentPage(
                (page) =>
                  Math.min(
                    pageCount,
                    page + 1,
                  ),
              )
            }
          />

          <div className="threev0-source-note">
            Sumber aktif:{" "}
            {data.sourceLabel ||
              "Google Sheets"}
          </div>
        </>
      )}
    </section>
  );
}
