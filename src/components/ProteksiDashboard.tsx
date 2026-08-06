// src/components/ProteksiDashboard.tsx
import { ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import "./ProteksiDashboard.css";

const PROTEKSI_DASHBOARD_URL =
  "https://ipn-ugraha.github.io/proteksi/";

export default function ProteksiDashboard() {
  const [frameKey, setFrameKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const reloadDashboard = () => {
    setIsLoading(true);
    setFrameKey((currentKey) => currentKey + 1);
  };

  return (
    <section className="content-view proteksi-view">
      <div className="proteksi-toolbar">
        <div className="proteksi-summary">
          <span className="proteksi-summary-icon">
            <ShieldCheck size={20} />
          </span>

          <span className="proteksi-summary-copy">
            <strong>Dashboard Monitoring Relai LCD</strong>
            <small>
              Penarikan indikasi FO Fail dan I Diff UITJBM
            </small>
          </span>
        </div>

        <div className="proteksi-actions">
          <button
            className="secondary-action"
            type="button"
            onClick={reloadDashboard}
          >
            <RefreshCw
              className={isLoading ? "proteksi-spin" : undefined}
              size={14}
            />
            Muat ulang
          </button>

          <a
            className="primary-action"
            href={PROTEKSI_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={14} />
            Buka tab baru
          </a>
        </div>
      </div>

      <article className="panel proteksi-frame-panel">
        {isLoading && (
          <div className="proteksi-loading" role="status" aria-live="polite">
            <RefreshCw className="proteksi-spin" size={24} />

            <span>
              <strong>Memuat dashboard proteksi</strong>
              <small>Mengambil data monitoring relai LCD...</small>
            </span>
          </div>
        )}

        <iframe
          key={frameKey}
          className="proteksi-frame"
          title="Dashboard Monitoring Relai LCD UITJBM"
          src={PROTEKSI_DASHBOARD_URL}
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="clipboard-read; clipboard-write; fullscreen"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      </article>
    </section>
  );
}
