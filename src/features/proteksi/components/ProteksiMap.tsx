import { MapPinned, MapPin, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GiProgressNode, ProtectionRecord } from "../types";
import { buildGiProgressMap } from "../utils/giProgress";

type MapFilter = "all" | "complete" | "incomplete";

const STATUS_COPY = {
  complete: {
    label: "Selesai",
    description: "Semua bay menyelesaikan empat progress",
    color: "#00d27a",
  },
  incomplete: {
    label: "Belum lengkap",
    description: "Minimal satu progress pada salah satu bay belum selesai",
    color: "#e63757",
  },
} as const;

function createPopupContent(node: GiProgressNode) {
  const popup = document.createElement("div");
  popup.className = "proteksi-map-popup";

  const title = document.createElement("strong");
  title.textContent = node.gi;

  const location = document.createElement("span");
  location.textContent = [
    node.ultg,
    node.upt,
  ].filter(Boolean).join(" · ");

  const status = document.createElement("b");
  status.className = `is-${node.status}`;
  status.textContent =
    `${STATUS_COPY[node.status].label} · ` +
    `${node.completeBay}/${node.totalBay} bay lengkap`;

  const progress = document.createElement("small");
  progress.textContent =
    `Y ${node.ja}/${node.totalBay} · ` +
    `AB ${node.jb}/${node.totalBay} · ` +
    `R ${node.jd}/${node.totalBay} · ` +
    `U ${node.je}/${node.totalBay}`;

  const precision = document.createElement("small");
  precision.textContent =
    node.precision === "approximate"
      ? `Titik perkiraan: ${node.locationLabel}`
      : `Lokasi: ${node.locationLabel}`;

  popup.append(title, location, status, progress, precision);

  return popup;
}

export function ProteksiMap({
  records,
}: {
  records: ProtectionRecord[];
}) {
  const { nodes, unresolvedGi } = useMemo(
    () => buildGiProgressMap(records),
    [records],
  );
  const [filter, setFilter] = useState<MapFilter>("all");
  const [selectedId, setSelectedId] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRefs = useRef<
    Map<string, import("leaflet").CircleMarker>
  >(new Map());

  const visibleNodes = useMemo(
    () =>
      nodes.filter(
        (node) => filter === "all" || node.status === filter,
      ),
    [filter, nodes],
  );

  const selectedNode =
    visibleNodes.find((node) => node.id === selectedId) ??
    visibleNodes[0] ??
    null;

  useEffect(() => {
    if (!selectedNode) {
      setSelectedId("");
      return;
    }

    if (selectedNode.id !== selectedId) {
      setSelectedId(selectedNode.id);
    }
  }, [selectedId, selectedNode]);

  useEffect(() => {
    let cancelled = false;
    const registry = markerRefs.current;

    const initialiseMap = async () => {
      const L = await import("leaflet");

      if (cancelled || !containerRef.current) {
        return;
      }

      mapRef.current?.remove();
      registry.clear();

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        minZoom: 6,
      }).setView([-7.55, 113.1], 8);

      mapRef.current = map;

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        },
      ).addTo(map);

      const bounds: Array<[number, number]> = [];

      for (const node of visibleNodes) {
        bounds.push([node.latitude, node.longitude]);

        const marker = L.circleMarker(
          [node.latitude, node.longitude],
          {
            radius: Math.min(14, 8 + Math.sqrt(node.totalBay)),
            color: "#ffffff",
            weight: 3,
            fillColor: STATUS_COPY[node.status].color,
            fillOpacity: 0.96,
            dashArray:
              node.precision === "approximate"
                ? "3 3"
                : undefined,
          },
        ).addTo(map);

        marker
          .bindPopup(createPopupContent(node), {
            minWidth: 220,
          })
          .bindTooltip(node.gi, {
            direction: "top",
            offset: [0, -8],
          });

        marker.on("click", () => {
          setSelectedId(node.id);
        });

        registry.set(node.id, marker);
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, {
          padding: [45, 45],
          maxZoom: 10,
        });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 11);
      }

      window.setTimeout(() => map.invalidateSize(), 0);
    };

    void initialiseMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      registry.clear();
    };
  }, [visibleNodes]);

  useEffect(() => {
    if (!selectedNode) {
      return;
    }

    const marker = markerRefs.current.get(selectedNode.id);

    if (!marker) {
      return;
    }

    marker.openPopup();
    mapRef.current?.panTo(marker.getLatLng(), {
      animate: true,
      duration: 0.35,
    });
  }, [selectedNode]);

  const completeCount = nodes.filter(
    (node) => node.status === "complete",
  ).length;
  const incompleteCount = nodes.length - completeCount;

  return (
    <article className="panel proteksi-map-panel">
      <div className="proteksi-map-head">
        <div>
          <span className="proteksi-map-title-icon">
            <MapPinned size={18} />
          </span>
          <span>
            <strong>Peta Progress Gardu Induk</strong>
            <small>
              Hijau jika seluruh bay menyelesaikan Y, AB, R, dan U;
              merah jika masih ada progress yang belum terealisasi
            </small>
          </span>
        </div>

        <div className="proteksi-map-summary">
          <span className="is-complete">
            <i />
            {completeCount} GI selesai
          </span>
          <span className="is-incomplete">
            <i />
            {incompleteCount} GI belum lengkap
          </span>
          {unresolvedGi.length > 0 && (
            <span className="is-unresolved">
              <TriangleAlert size={12} />
              {unresolvedGi.length} tanpa koordinat
            </span>
          )}
        </div>
      </div>

      <div className="proteksi-map-filter" aria-label="Filter status GI">
        {(
          [
            ["all", "Semua"],
            ["complete", "Selesai"],
            ["incomplete", "Belum lengkap"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            type="button"
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="proteksi-map-layout">
        <div className="proteksi-map-canvas-wrap">
          {visibleNodes.length > 0 ? (
            <div
              className="proteksi-map-canvas"
              ref={containerRef}
              aria-label="Peta progress gardu induk"
            />
          ) : (
            <div className="proteksi-map-empty">
              <MapPin size={28} />
              <strong>Tidak ada GI untuk filter ini</strong>
              <span>
                Pilih status lain atau ubah filter utama Proteksi.
              </span>
            </div>
          )}
        </div>

        <aside className="proteksi-map-list">
          <div className="proteksi-map-list-head">
            <strong>Daftar Gardu Induk</strong>
            <small>{visibleNodes.length} titik ditampilkan</small>
          </div>

          <div className="proteksi-map-list-scroll">
            {visibleNodes.map((node) => (
              <button
                className={
                  selectedNode?.id === node.id ? "active" : ""
                }
                key={node.id}
                type="button"
                onClick={() => setSelectedId(node.id)}
              >
                <i className={`is-${node.status}`} />
                <span>
                  <strong>{node.gi}</strong>
                  <small>
                    {[node.ultg, node.upt]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </span>
                <span>
                  <b>
                    {node.completeBay}/{node.totalBay}
                  </b>
                  <small>bay lengkap</small>
                </span>
              </button>
            ))}
          </div>

          {unresolvedGi.length > 0 && (
            <details className="proteksi-map-unresolved">
              <summary>
                {unresolvedGi.length} GI belum memiliki koordinat
              </summary>
              <p>
                {unresolvedGi.join(", ")}
              </p>
            </details>
          )}
        </aside>
      </div>

      <div className="proteksi-map-footnote">
        <span>
          <i className="is-complete" />
          Selesai: seluruh bay pada GI memiliki empat tanggal realisasi
        </span>
        <span>
          <i className="is-incomplete" />
          Belum lengkap: minimal satu tanggal realisasi masih kosong
        </span>
        <small>
          Marker garis putus-putus menggunakan hasil lokasi perkiraan
        </small>
      </div>
    </article>
  );
}
