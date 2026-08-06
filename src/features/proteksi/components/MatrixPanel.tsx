import { UPT_COLORS } from "../config";
import { percentage } from "../utils/domain";
import type { UptSummary } from "../types";

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

export function MatrixPanel({
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
                    <td>
                      <ScorePill value={summary.ja} total={summary.total} />
                    </td>
                    <td>
                      <ScorePill value={summary.jb} total={summary.total} />
                    </td>
                    <td>
                      <ScorePill value={summary.jd} total={summary.total} />
                    </td>
                    <td>
                      <ScorePill value={summary.je} total={summary.total} />
                    </td>
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
