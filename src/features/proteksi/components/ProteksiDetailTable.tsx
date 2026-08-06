import { Download } from "lucide-react";
import { UPT_COLORS } from "../config";
import { formatRealizationDate } from "../utils/domain";
import type {
  ProtectionRecord,
  SortDirection,
  SortKey,
} from "../types";
import { CompletionDate } from "./CompletionDate";

type ProteksiDetailTableProps = {
  records: ProtectionRecord[];
  lastUpdated: Date | null;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  onExport: () => void;
  currentPage: number;
  pageCount: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function ProteksiDetailTable({
  records,
  lastUpdated,
  sortKey,
  sortDirection,
  onSort,
  onExport,
  currentPage,
  pageCount,
  onPreviousPage,
  onNextPage,
}: ProteksiDetailTableProps) {
  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) {
      return "⇅";
    }

    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
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
            onClick={onExport}
            disabled={records.length === 0}
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
                <button type="button" onClick={() => onSort("uptShort")}>
                  UPT {sortIndicator("uptShort")}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => onSort("ultg")}>
                  ULTG {sortIndicator("ultg")}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => onSort("gi")}>
                  GI/GIS {sortIndicator("gi")}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => onSort("bay")}>
                  Bay {sortIndicator("bay")}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => onSort("redundancy")}>
                  GI-Bay-Redundant {sortIndicator("redundancy")}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => onSort("critical")}>
                  Kritikal {sortIndicator("critical")}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => onSort("relayType")}>
                  Jenis Relay {sortIndicator("relayType")}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => onSort("relayBrand")}>
                  Merk MPU {sortIndicator("relayBrand")}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => onSort("relayModel")}>
                  Tipe MPU {sortIndicator("relayModel")}
                </button>
              </th>
              <th>FO Fail Dash/EWS (R)</th>
              <th>Diff Dash/EWS (U)</th>
              <th>FO Fail Ann. (Y)</th>
              <th>Diff Ann. (AB)</th>
              <th>
                <button type="button" onClick={() => onSort("score")}>
                  Skor {sortIndicator("score")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td className="proteksi-table-empty" colSpan={14}>
                  Tidak ada data yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
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
          Halaman {currentPage} dari {pageCount}
        </span>
        <div>
          <button
            className="secondary-action"
            type="button"
            disabled={currentPage <= 1}
            onClick={onPreviousPage}
          >
            Sebelumnya
          </button>
          <button
            className="secondary-action"
            type="button"
            disabled={currentPage >= pageCount}
            onClick={onNextPage}
          >
            Berikutnya
          </button>
        </div>
      </div>
    </article>
  );
}
