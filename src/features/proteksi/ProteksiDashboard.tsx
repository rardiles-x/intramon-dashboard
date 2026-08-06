import "../../components/ProteksiDashboard.css";
import { MatrixPanel } from "./components/MatrixPanel";
import { ProgressPanel } from "./components/ProgressPanel";
import { ProteksiDetailTable } from "./components/ProteksiDetailTable";
import {
  ProteksiError,
  ProteksiLoading,
} from "./components/ProteksiFeedback";
import { ProteksiFilters } from "./components/ProteksiFilters";
import { ProteksiMetrics } from "./components/ProteksiMetrics";
import { ProteksiToolbar } from "./components/ProteksiToolbar";
import { RelayDistribution } from "./components/RelayDistribution";
import { TimelinePanel } from "./components/TimelinePanel";
import { UptProgressPanel } from "./components/UptProgressPanel";
import { useProteksiDashboard } from "./hooks/useProteksiDashboard";

export default function ProteksiDashboard() {
  const dashboard = useProteksiDashboard();

  return (
    <section className="content-view proteksi-native">
      <ProteksiToolbar
        loadStatus={dashboard.loadStatus}
        statusLabel={dashboard.statusLabel}
        onRefresh={dashboard.refresh}
      />

      {dashboard.loadStatus === "error" &&
      dashboard.records.length === 0 ? (
        <ProteksiError
          message={dashboard.errorMessage}
          onRetry={dashboard.refresh}
        />
      ) : (
        <>
          <ProteksiFilters
            searchQuery={dashboard.searchQuery}
            onSearchQueryChange={dashboard.setSearchQuery}
            uptFilter={dashboard.uptFilter}
            onUptFilterChange={dashboard.setUptFilter}
            uptOptions={dashboard.uptOptions}
            criticalFilter={dashboard.criticalFilter}
            onCriticalFilterChange={dashboard.setCriticalFilter}
            relayFilter={dashboard.relayFilter}
            onRelayFilterChange={dashboard.setRelayFilter}
            scoreFilter={dashboard.scoreFilter}
            onScoreFilterChange={dashboard.setScoreFilter}
            filteredCount={dashboard.filteredRecords.length}
            totalCount={dashboard.records.length}
            onReset={dashboard.resetFilters}
          />

          {dashboard.loadStatus === "loading" &&
          dashboard.records.length === 0 ? (
            <ProteksiLoading />
          ) : (
            <>
              <ProteksiMetrics metrics={dashboard.metrics} />

              <div className="proteksi-two-columns">
                <ProgressPanel
                  items={dashboard.progressItems}
                  total={dashboard.metrics.lcd}
                />
                <RelayDistribution
                  records={dashboard.filteredRecords}
                />
              </div>

              <div className="proteksi-two-columns">
                <UptProgressPanel
                  title="Status Annunciator per UPT"
                  subtitle="Realisasi tanggal FO Fail dan Diff Alarm/Spv"
                  summaries={dashboard.uptSummaries}
                  firstKey="ja"
                  secondKey="jb"
                  firstLabel="FO Fail"
                  secondLabel="Diff Alarm/Spv"
                />
                <UptProgressPanel
                  title="Status Dashboard & EWS per UPT"
                  subtitle="Realisasi tanggal FO Fail dan Diff Alarm/Spv"
                  summaries={dashboard.uptSummaries}
                  firstKey="jd"
                  secondKey="je"
                  firstLabel="FO Fail"
                  secondLabel="Diff Alarm/Spv"
                />
              </div>

              <MatrixPanel summaries={dashboard.uptSummaries} />

              <div className="proteksi-two-columns">
                <TimelinePanel
                  title="Timeline Annunciator"
                  subtitle="Tanggal realisasi kolom Y dan AB per bulan"
                  points={dashboard.annunciatorTimeline}
                  firstLabel="FO Fail (Y)"
                  secondLabel="Diff Alarm/Spv (AB)"
                />
                <TimelinePanel
                  title="Timeline Dashboard & EWS"
                  subtitle="Tanggal realisasi kolom R dan U per bulan"
                  points={dashboard.dashboardTimeline}
                  firstLabel="FO Fail (R)"
                  secondLabel="Diff Alarm/Spv (U)"
                />
              </div>

              <ProteksiDetailTable
                records={dashboard.pagedRecords}
                lastUpdated={dashboard.lastUpdated}
                sortKey={dashboard.sortKey}
                sortDirection={dashboard.sortDirection}
                onSort={dashboard.changeSort}
                onExport={dashboard.exportFilteredData}
                currentPage={dashboard.safeCurrentPage}
                pageCount={dashboard.pageCount}
                onPreviousPage={dashboard.previousPage}
                onNextPage={dashboard.nextPage}
              />
            </>
          )}
        </>
      )}
    </section>
  );
}
