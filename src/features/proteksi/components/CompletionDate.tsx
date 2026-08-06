import { CheckCircle2, XCircle } from "lucide-react";
import {
  formatRealizationDate,
  hasRealizationDate,
} from "../utils/domain";

export function CompletionDate({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const completed = hasRealizationDate(value);
  const display = formatRealizationDate(value);

  return (
    <span
      className={`proteksi-completion ${
        completed ? "is-complete" : "is-incomplete"
      }`}
      title={
        completed
          ? `${label}: ${value}`
          : `${label}: belum terealisasi`
      }
      aria-label={
        completed
          ? `${label} terealisasi ${display}`
          : `${label} belum terealisasi`
      }
    >
      {completed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      <small>{display}</small>
    </span>
  );
}
