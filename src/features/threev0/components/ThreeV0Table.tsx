import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import type {
  ThreeV0Record,
  ThreeV0SortDirection,
  ThreeV0SortKey,
} from "../types";
import {
  implementationTone,
  isRealized,
} from "../utils";

type Props = {
  records: ThreeV0Record[];
  filteredCount: number;
  totalCount: number;  sortKey: ThreeV0SortKey;
  sortDirection: ThreeV0SortDirection;
  onSort: (
    key: ThreeV0SortKey,
  ) => void;
  onExport: () => void;
  currentPage: number;
  pageCount: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

const COLUMNS: Array<{
  key: ThreeV0SortKey;
  label: string;
}> = [
  { key: "upt", label: "UPT" },
  { key: "ultg", label: "ULTG" },
  { key: "gi", label: "GI" },
  { key: "bay", label: "Bay" },
  {
    key: "sbefModel",
    label: "Merk dan Tipe SBEF",
  },
  {
    key: "analogStatus",
    label:
      "Status Penarikan Analog Tegangan",
  },
  {
    key: "analogTarget",
    label:
      "Target Penarikan Analog Tegangan",
  },
  {
    key: "analogRealization",
    label:
      "Realisasi Analog Tegangan LV",
  },
  {
    key: "alarmStatus",
    label:
      "Aktivasi 3V0 untuk Alarm",
  },
  {
    key: "alarmTarget",
    label:
      "Target Aktivasi 3V0 untuk Alarm",
  },
  {
    key: "alarmRealization",
    label:
      "Realisasi Alarm 3V0",
  },
  {
    key: "sbefConfiguration",
    label:
      "SBEF Terpisah / Gabung OCR HV / LV",
  },
];

function StatusCell({
  value,
}: {
  value: string;
}) {
  const tone = implementationTone(value);

  return (
    <span
      className={
        `threev0-status-pill is-${tone}`
      }
      title={value || "Belum"}
    >
      {value || "Belum"}
    </span>
  );
}

function RealizationCell({
  value,
}: {
  value: string;
}) {
  const complete = isRealized(value);

  return (
    <span
      className={
        `threev0-realization ` +
        `${complete ? "is-complete" : "is-pending"}`
      }
    >
      {complete && (
        <CheckCircle2 size={12} />
      )}
      {complete ? value : "Belum"}
    </span>
  );
}

function SortLabel({
  column,
  sortKey,
  sortDirection,
  onSort,
}: {
  column: {
    key: ThreeV0SortKey;
    label: string;
  };
  sortKey: ThreeV0SortKey;
  sortDirection: ThreeV0SortDirection;
  onSort: (
    key: ThreeV0SortKey,
  ) => void;
}) {
  const active =
    sortKey === column.key;

  return (
    <button
      type="button"
      onClick={() =>
        onSort(column.key)
      }
      title={`Urutkan ${column.label}`}
    >
      {column.label}
      {active && (
        <span className="threev0-sort-indicator">
          {sortDirection === "asc"
            ? "↑"
            : "↓"}
        </span>
      )}
    </button>
  );
}

export function ThreeV0DetailTable({
  records,
  filteredCount,
  totalCount,  sortKey,
  sortDirection,
  onSort,
  onExport,
  currentPage,
  pageCount,
  onPreviousPage,
  onNextPage,
}: Props) {
  return (
    <article className="panel proteksi-detail-panel">
      <div className="proteksi-detail-head">
        <span>
          <strong>
            Detail Monitoring 3V0
          </strong>
        </span>

        <div>
          <span className="proteksi-detail-count">
            {filteredCount.toLocaleString(
              "id-ID",
            )}
            /
            {totalCount.toLocaleString(
              "id-ID",
            )}{" "}
            baris
          </span>

          <button
            className="secondary-action"
            type="button"
            onClick={onExport}
            disabled={filteredCount === 0}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="proteksi-table-scroll proteksi-detail-scroll">
        <table className="proteksi-detail-table threev0-detail-table">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.key}>
                  <SortLabel
                    column={column}
                    sortKey={sortKey}
                    sortDirection={
                      sortDirection
                    }
                    onSort={onSort}
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.upt}</td>
                <td>{record.ultg}</td>
                <td title={record.gi}>
                  {record.gi}
                </td>
                <td title={record.bay}>
                  {record.bay}
                </td>
                <td title={record.sbefModel}>
                  {record.sbefModel || "—"}
                </td>
                <td>
                  <StatusCell
                    value={record.analogStatus}
                  />
                </td>
                <td>
                  {record.analogTarget || "—"}
                </td>
                <td>
                  <RealizationCell
                    value={
                      record.analogRealization
                    }
                  />
                </td>
                <td>
                  <StatusCell
                    value={record.alarmStatus}
                  />
                </td>
                <td>
                  {record.alarmTarget || "—"}
                </td>
                <td>
                  <RealizationCell
                    value={
                      record.alarmRealization
                    }
                  />
                </td>
                <td>
                  <span className="proteksi-tag is-neutral">
                    {record.sbefConfiguration ||
                      "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {records.length === 0 && (
        <div className="threev0-table-empty">
          Data tidak ditemukan untuk filter
          yang dipilih.
        </div>
      )}

      <div className="proteksi-pagination">
        <span>
          Halaman {currentPage} dari{" "}
          {pageCount}
        </span>

        <div>
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft size={14} />
            Sebelumnya
          </button>

          <button
            type="button"
            onClick={onNextPage}
            disabled={
              currentPage >= pageCount
            }
          >
            Berikutnya
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
