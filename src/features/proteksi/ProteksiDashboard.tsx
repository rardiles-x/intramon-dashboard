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
import { ProteksiMap } from "./components/ProteksiMap";
import { ProteksiToolbar } from "./components/ProteksiToolbar";
import { RelayBrandDistribution } from "./components/RelayBrandDistribution";
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

              <ProgressPanel
                items={dashboard.progressItems}
                total={dashboard.metrics.lcd}
              />

              <div className="proteksi-two-columns">
                <RelayDistribution
                  records={dashboard.filteredRecords}
                />
                <RelayBrandDistribution
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

              <ProteksiMap records={dashboard.filteredRecords} />

              <div className="proteksi-two-columns">
                <TimelinePanel
                  title="Timeline Annunciator"
                  subtitle="Target kolom P dan realisasi kolom Y/AB per bulan"
                  points={dashboard.annunciatorTimeline}
                  targetLabel="Target Integrasi (P)"
                  firstLabel="FO Fail (Y)"
                  secondLabel="Diff Alarm/Spv (AB)"
                />
                <TimelinePanel
                  title="Timeline Dashboard & EWS"
                  subtitle="Target kolom W dan realisasi kolom R/U per bulan"
                  points={dashboard.dashboardTimeline}
                  targetLabel="Target Integrasi (W)"
                  firstLabel="FO Fail (R)"
                  secondLabel="Diff Alarm/Spv (U)"
                />
              </div>

              <ProteksiDetailTable
                records={dashboard.pagedRecords}
                filteredCount={
                  dashboard.detailFilteredRecords.length
                }
                globalCount={dashboard.filteredRecords.length}
                lastUpdated={dashboard.lastUpdated}
                sortKey={dashboard.sortKey}
                sortDirection={dashboard.sortDirection}
                onSort={dashboard.changeSort}
                onExport={dashboard.exportFilteredData}
                columnFilters={dashboard.detailFilters}
                filterOptions={dashboard.detailFilterOptions}
                onColumnFilterChange={
                  dashboard.updateDetailFilter
                }
                onResetColumnFilters={
                  dashboard.resetDetailFilters
                }
                hasActiveColumnFilters={
                  dashboard.hasActiveDetailFilters
                }
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
