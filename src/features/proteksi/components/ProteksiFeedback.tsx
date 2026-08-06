import { AlertCircle, RefreshCw } from "lucide-react";

type ProteksiErrorProps = {
  message: string;
  onRetry: () => void;
};

export function ProteksiError({
  message,
  onRetry,
}: ProteksiErrorProps) {
  return (
    <article className="panel proteksi-error">
      <AlertCircle size={28} />
      <div>
        <strong>Data proteksi belum dapat dimuat</strong>
        <p>{message}</p>
        <button
          className="primary-action"
          type="button"
          onClick={onRetry}
        >
          <RefreshCw size={14} />
          Coba lagi
        </button>
      </div>
    </article>
  );
}

export function ProteksiLoading() {
  return (
    <article className="panel proteksi-loading">
      <RefreshCw className="proteksi-spin" size={24} />
      <span>
        <strong>Mengambil data Google Sheets</strong>
        <small>Menyiapkan analitik proteksi...</small>
      </span>
    </article>
  );
}
