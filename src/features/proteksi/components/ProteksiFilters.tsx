import { RotateCcw, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import type {
  CriticalFilter,
  RelayFilter,
  ScoreFilter,
} from "../types";

type ProteksiFiltersProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  uptFilter: string;
  onUptFilterChange: (value: string) => void;
  uptOptions: string[];
  criticalFilter: CriticalFilter;
  onCriticalFilterChange: (value: CriticalFilter) => void;
  relayFilter: RelayFilter;
  onRelayFilterChange: (value: RelayFilter) => void;
  scoreFilter: ScoreFilter;
  onScoreFilterChange: (value: ScoreFilter) => void;
  filteredCount: number;
  totalCount: number;
  onReset: () => void;
};

export function ProteksiFilters({
  searchQuery,
  onSearchQueryChange,
  uptFilter,
  onUptFilterChange,
  uptOptions,
  criticalFilter,
  onCriticalFilterChange,
  relayFilter,
  onRelayFilterChange,
  scoreFilter,
  onScoreFilterChange,
  filteredCount,
  totalCount,
  onReset,
}: ProteksiFiltersProps) {
  return (
    <article className="panel proteksi-filter-panel">
      <div className="proteksi-search">
        <Search size={14} />
        <input
          value={searchQuery}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onSearchQueryChange(event.target.value)
          }
          placeholder="Cari UPT, ULTG, GI/GIS, bay, redundant, merk, atau tipe MPU..."
          aria-label="Cari data proteksi"
        />
      </div>

      <select
        value={uptFilter}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onUptFilterChange(event.target.value)
        }
        aria-label="Filter UPT"
      >
        <option value="">Semua UPT</option>
        {uptOptions.map((upt) => (
          <option value={upt} key={upt}>
            {upt}
          </option>
        ))}
      </select>

      <select
        value={criticalFilter}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onCriticalFilterChange(event.target.value as CriticalFilter)
        }
        aria-label="Filter kritikal"
      >
        <option value="">Semua Kritikal</option>
        <option value="YA">Kritikal (YA)</option>
        <option value="TIDAK">Non Kritikal</option>
      </select>

      <select
        value={relayFilter}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onRelayFilterChange(event.target.value as RelayFilter)
        }
        aria-label="Filter jenis relai"
      >
        <option value="">Semua Jenis Relai</option>
        <option value="LCD">LCD</option>
        <option value="Distance">Distance</option>
      </select>

      <select
        value={scoreFilter}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onScoreFilterChange(event.target.value as ScoreFilter)
        }
        aria-label="Filter skor"
      >
        <option value="">Semua Progress</option>
        <option value="4">Skor 4 — Lengkap</option>
        <option value="3">Skor 3</option>
        <option value="2">Skor 2</option>
        <option value="1">Skor 1</option>
        <option value="0">Skor 0</option>
      </select>

      <button
        className="secondary-action"
        type="button"
        onClick={onReset}
      >
        <RotateCcw size={14} />
        Reset
      </button>

      <span className="proteksi-filter-count">
        {filteredCount.toLocaleString("id-ID")} dari{" "}
        {totalCount.toLocaleString("id-ID")} baris
      </span>
    </article>
  );
}
