import {
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { SPREADSHEET_URL } from "../config";
import type { LoadStatus } from "../types";

type ProteksiToolbarProps = {
  loadStatus: LoadStatus;
  statusLabel: string;
  onRefresh: () => void;
};

export function ProteksiToolbar({
  loadStatus,
  statusLabel,
  onRefresh,
}: ProteksiToolbarProps) {
  return (
    <div className="proteksi-native-toolbar panel">
      <div className="proteksi-native-title">
        <span>
          <ShieldCheck size={20} />
        </span>
        <div>
          <strong>Monitoring Relai LCD — UITJBM</strong>
          <small>
            Realisasi FO Fail dan Diff Alarm/Spv menuju Annunciator, Dashboard, dan EWS
          </small>
        </div>
      </div>

      <div className="proteksi-native-actions">
        <span
          className={`proteksi-data-status is-${loadStatus}`}
          role="status"
        >
          <i />
          {statusLabel}
        </span>
        <button
          className="secondary-action"
          type="button"
          onClick={onRefresh}
          disabled={loadStatus === "loading"}
        >
          <RefreshCw
            className={
              loadStatus === "loading" ? "proteksi-spin" : undefined
            }
            size={14}
          />
          Sinkronkan
        </button>
        <a
          className="secondary-action"
          href={SPREADSHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={14} />
          Buka Spreadsheet
        </a>
      </div>
    </div>
  );
}
