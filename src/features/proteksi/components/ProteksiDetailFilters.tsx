import type { ChangeEvent } from "react";
import type {
  DetailColumnFilters,
  DetailFilterOptions,
  RealizationFilter,
  ScoreFilter,
  UpdateDetailColumnFilter,
} from "../types";

type ProteksiDetailFiltersProps = {
  filters: DetailColumnFilters;
  options: DetailFilterOptions;
  onChange: UpdateDetailColumnFilter;
};

function TextFilter({
  value,
  label,
  placeholder,
  onChange,
}: {
  value: string;
  label: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      className="proteksi-column-filter"
      type="search"
      value={value}
      aria-label={label}
      placeholder={placeholder}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value)
      }
    />
  );
}

function RealizationSelect({
  value,
  label,
  onChange,
}: {
  value: RealizationFilter;
  label: string;
  onChange: (value: RealizationFilter) => void;
}) {
  return (
    <select
      className="proteksi-column-filter is-narrow"
      value={value}
      aria-label={label}
      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
        onChange(event.target.value as RealizationFilter)
      }
    >
      <option value="">Semua</option>
      <option value="complete">Selesai</option>
      <option value="incomplete">Belum</option>
    </select>
  );
}

export function ProteksiDetailFilters({
  filters,
  options,
  onChange,
}: ProteksiDetailFiltersProps) {
  return (
    <tr className="proteksi-column-filter-row">
      <th>
        <select
          className="proteksi-column-filter"
          value={filters.uptShort}
          aria-label="Filter kolom UPT"
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onChange("uptShort", event.target.value)
          }
        >
          <option value="">Semua</option>
          {options.uptShort.map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
      </th>
      <th>
        <TextFilter
          value={filters.ultg}
          label="Filter kolom ULTG"
          placeholder="Cari..."
          onChange={(value) => onChange("ultg", value)}
        />
      </th>
      <th>
        <TextFilter
          value={filters.gi}
          label="Filter kolom GI atau GIS"
          placeholder="Cari..."
          onChange={(value) => onChange("gi", value)}
        />
      </th>
      <th>
        <TextFilter
          value={filters.bay}
          label="Filter kolom Bay"
          placeholder="Cari..."
          onChange={(value) => onChange("bay", value)}
        />
      </th>
      <th>
        <TextFilter
          value={filters.redundancy}
          label="Filter kolom GI-Bay-Redundant"
          placeholder="Cari..."
          onChange={(value) => onChange("redundancy", value)}
        />
      </th>
      <th>
        <select
          className="proteksi-column-filter is-narrow"
          value={filters.critical}
          aria-label="Filter kolom Kritikal"
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onChange("critical", event.target.value)
          }
        >
          <option value="">Semua</option>
          <option value="YA">YA</option>
          <option value="TIDAK">TIDAK</option>
        </select>
      </th>
      <th>
        <select
          className="proteksi-column-filter"
          value={filters.relayType}
          aria-label="Filter kolom Jenis Relay"
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onChange("relayType", event.target.value)
          }
        >
          <option value="">Semua</option>
          {options.relayType.map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
      </th>
      <th>
        <select
          className="proteksi-column-filter"
          value={filters.relayBrand}
          aria-label="Filter kolom Merk MPU"
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onChange("relayBrand", event.target.value)
          }
        >
          <option value="">Semua</option>
          {options.relayBrand.map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
      </th>
      <th>
        <TextFilter
          value={filters.relayModel}
          label="Filter kolom Tipe MPU"
          placeholder="Cari..."
          onChange={(value) => onChange("relayModel", value)}
        />
      </th>
      <th>
        <RealizationSelect
          value={filters.jd}
          label="Filter realisasi FO Fail Dashboard dan EWS"
          onChange={(value) => onChange("jd", value)}
        />
      </th>
      <th>
        <RealizationSelect
          value={filters.je}
          label="Filter realisasi Diff Dashboard dan EWS"
          onChange={(value) => onChange("je", value)}
        />
      </th>
      <th>
        <RealizationSelect
          value={filters.ja}
          label="Filter realisasi FO Fail Annunciator"
          onChange={(value) => onChange("ja", value)}
        />
      </th>
      <th>
        <RealizationSelect
          value={filters.jb}
          label="Filter realisasi Diff Annunciator"
          onChange={(value) => onChange("jb", value)}
        />
      </th>
      <th>
        <select
          className="proteksi-column-filter is-score"
          value={filters.score}
          aria-label="Filter kolom Skor"
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onChange("score", event.target.value as ScoreFilter)
          }
        >
          <option value="">Semua</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
          <option value="0">0</option>
        </select>
      </th>
    </tr>
  );
}
