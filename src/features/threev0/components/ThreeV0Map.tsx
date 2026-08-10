import {
  MapPin,
  MapPinned,
  TriangleAlert,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ThreeV0GiNode,
  ThreeV0ProgressStatus,
  ThreeV0Record,
} from "../types";
import {
  buildThreeV0GiMap,
  isRealized,
} from "../utils";

type MapFilter =
  | "all"
  | ThreeV0ProgressStatus;

const STATUS_COPY = {
  complete: {
    label: "Selesai",
    color: "#00d27a",
  },
  partial: {
    label: "Sebagian",
    color: "#f9a825",
  },
  pending: {
    label: "Belum",
    color: "#e63757",
  },
} as const;

function createPopupContent(
  node: ThreeV0GiNode,
) {
  const popup =
    document.createElement("div");

  popup.className =
    "proteksi-map-popup threev0-map-popup";

  const title =
    document.createElement("strong");

  title.textContent = node.gi;

  const location =
    document.createElement("span");

  location.textContent = [
    node.ultg,
    node.upt,
  ]
    .filter(Boolean)
    .join(" · ");

  const status =
    document.createElement("b");

  status.className =
    `is-${node.status}`;

  status.textContent =
    `${STATUS_COPY[node.status].label} · ` +
    `${node.progress}% progress`;

  const progress =
    document.createElement("small");

  progress.textContent =
    `Analog ${node.analogRealized}/${node.totalBay} · ` +
    `Alarm 3V0 ${node.alarmRealized}/${node.totalBay} · ` +
    `Selesai ${node.completeBay}/${node.totalBay}`;

  const bayList =
    document.createElement("div");

  bayList.className =
    "threev0-map-popup-bays";

  node.bays
    .slice(0, 7)
    .forEach((bay) => {
      const row =
        document.createElement("div");

      const name =
        document.createElement("strong");

      name.textContent = bay.bay;

      const detail =
        document.createElement("small");

      detail.textContent =
        `Analog: ${
          isRealized(
            bay.analogRealization,
          )
            ? bay.analogRealization
            : "Belum"
        } · 3V0: ${
          isRealized(
            bay.alarmRealization,
          )
            ? bay.alarmRealization
            : "Belum"
        }`;

      row.append(name, detail);
      bayList.append(row);
    });

  if (node.bays.length > 7) {
    const more =
      document.createElement("small");

    more.textContent =
      `+${node.bays.length - 7} Bay lainnya`;

    bayList.append(more);
  }

  const precision =
    document.createElement("small");

  precision.textContent =
    node.precision === "approximate"
      ? `Titik perkiraan: ${node.locationLabel}`
      : `Lokasi: ${node.locationLabel}`;

  popup.append(
    title,
    location,
    status,
    progress,
    bayList,
    precision,
  );

  return popup;
}

export function ThreeV0Map({
  records,
}: {
  records: ThreeV0Record[];
}) {
  const {
    nodes,
    unresolvedGi,
  } = useMemo(
    () =>
      buildThreeV0GiMap(records),
    [records],
  );

  const [filter, setFilter] =
    useState<MapFilter>("all");

  const [
    selectedId,
    setSelectedId,
  ] = useState("");

  const containerRef =
    useRef<HTMLDivElement>(null);

  const mapRef =
    useRef<import("leaflet").Map | null>(
      null,
    );

  const markerRefs = useRef<
    Map<
      string,
      import("leaflet").CircleMarker
    >
  >(new Map());

  const visibleNodes = useMemo(
    () =>
      nodes.filter(
        (node) =>
          filter === "all" ||
          node.status === filter,
      ),
    [filter, nodes],
  );

  const selectedNode =
    visibleNodes.find(
      (node) =>
        node.id === selectedId,
    ) ??
    visibleNodes[0] ??
    null;

  useEffect(() => {
    if (!selectedNode) {
      setSelectedId("");
      return;
    }

    if (
      selectedNode.id !== selectedId
    ) {
      setSelectedId(selectedNode.id);
    }
  }, [selectedId, selectedNode]);

  useEffect(() => {
    let cancelled = false;
    const registry =
      markerRefs.current;

    const initialiseMap =
      async () => {
        const L =
          await import("leaflet");

        if (
          cancelled ||
          !containerRef.current
        ) {
          return;
        }

        mapRef.current?.remove();
        registry.clear();

        const map = L.map(
          containerRef.current,
          {
            zoomControl: true,
            scrollWheelZoom: true,
            minZoom: 6,
          },
        ).setView(
          [-7.55, 113.1],
          8,
        );

        mapRef.current = map;

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 18,
          },
        ).addTo(map);

        const bounds: Array<
          [number, number]
        > = [];

        visibleNodes.forEach(
          (node) => {
            bounds.push([
              node.latitude,
              node.longitude,
            ]);

            const marker =
              L.circleMarker(
                [
                  node.latitude,
                  node.longitude,
                ],
                {
                  radius: Math.min(
                    14,
                    8 +
                      Math.sqrt(
                        node.totalBay,
                      ),
                  ),
                  color: "#ffffff",
                  weight: 3,
                  fillColor:
                    STATUS_COPY[
                      node.status
                    ].color,
                  fillOpacity: 0.96,
                  dashArray:
                    node.precision ===
                    "approximate"
                      ? "3 3"
                      : undefined,
                },
              ).addTo(map);

            marker
              .bindPopup(
                createPopupContent(
                  node,
                ),
                {
                  minWidth: 250,
                  maxWidth: 330,
                },
              )
              .bindTooltip(
                node.gi,
                {
                  direction: "top",
                  offset: [0, -8],
                },
              );

            marker.on(
              "click",
              () =>
                setSelectedId(
                  node.id,
                ),
            );

            registry.set(
              node.id,
              marker,
            );
          },
        );

        if (bounds.length > 1) {
          map.fitBounds(bounds, {
            padding: [45, 45],
            maxZoom: 10,
          });
        } else if (
          bounds.length === 1
        ) {
          map.setView(
            bounds[0]!,
            11,
          );
        }

        window.setTimeout(
          () =>
            map.invalidateSize(),
          0,
        );
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

    const marker =
      markerRefs.current.get(
        selectedNode.id,
      );

    if (!marker) {
      return;
    }

    marker.openPopup();

    mapRef.current?.panTo(
      marker.getLatLng(),
      {
        animate: true,
        duration: 0.35,
      },
    );
  }, [selectedNode]);

  const counts = {
    complete: nodes.filter(
      (node) =>
        node.status === "complete",
    ).length,
    partial: nodes.filter(
      (node) =>
        node.status === "partial",
    ).length,
    pending: nodes.filter(
      (node) =>
        node.status === "pending",
    ).length,
  };

  return (
    <article className="panel proteksi-map-panel">
      <div className="proteksi-map-head">
        <div>
          <span className="proteksi-map-title-icon">
            <MapPinned size={18} />
          </span>

          <span>
            <strong>
              Peta Realisasi Monitoring 3V0
            </strong>
            <small>
              Hijau seluruh Bay selesai
              AR+AU; kuning sebagian;
              merah belum ada realisasi
            </small>
          </span>
        </div>

        <div className="proteksi-map-summary">
          <span className="is-complete">
            <i />
            {counts.complete} GI selesai
          </span>

          <span className="is-partial">
            <i />
            {counts.partial} GI sebagian
          </span>

          <span className="is-pending">
            <i />
            {counts.pending} GI belum
          </span>

          {unresolvedGi.length > 0 && (
            <span className="is-unresolved">
              <TriangleAlert size={12} />
              {unresolvedGi.length} tanpa
              koordinat
            </span>
          )}
        </div>
      </div>

      <div
        className="proteksi-map-filter"
        aria-label="Filter status realisasi 3V0"
      >
        {(
          [
            ["all", "Semua"],
            ["complete", "Selesai"],
            ["partial", "Sebagian"],
            ["pending", "Belum"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            className={
              filter === value
                ? "active"
                : ""
            }
            type="button"
            onClick={() =>
              setFilter(value)
            }
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
              aria-label="Peta realisasi Monitoring 3V0"
            />
          ) : (
            <div className="proteksi-map-empty">
              <MapPin size={28} />
              <strong>
                Tidak ada GI untuk filter
                ini
              </strong>
              <span>
                Pilih status peta lainnya.
              </span>
            </div>
          )}
        </div>

        <aside className="proteksi-map-list">
          <div className="proteksi-map-list-head">
            <strong>
              Daftar Gardu Induk
            </strong>
            <small>
              {visibleNodes.length} titik
              ditampilkan
            </small>
          </div>

          <div className="proteksi-map-list-scroll">
            {visibleNodes.map(
              (node) => (
                <button
                  className={
                    selectedNode?.id ===
                    node.id
                      ? "active"
                      : ""
                  }
                  key={node.id}
                  type="button"
                  onClick={() =>
                    setSelectedId(
                      node.id,
                    )
                  }
                >
                  <i
                    className={
                      `is-${node.status}`
                    }
                  />

                  <span>
                    <strong>
                      {node.gi}
                    </strong>
                    <small>
                      {[
                        node.ultg,
                        node.upt,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </span>

                  <span>
                    <b>
                      {node.progress}%
                    </b>
                    <small>
                      progress
                    </small>
                  </span>
                </button>
              ),
            )}
          </div>

          {unresolvedGi.length > 0 && (
            <details className="proteksi-map-unresolved">
              <summary>
                {unresolvedGi.length} GI
                belum memiliki koordinat
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
          Selesai: semua Bay memiliki
          realisasi AR dan AU
        </span>

        <span>
          <i className="is-partial" />
          Sebagian: minimal satu
          realisasi sudah ada
        </span>

        <span>
          <i className="is-pending" />
          Belum: AR dan AU seluruh Bay
          masih kosong
        </span>
      </div>
    </article>
  );
}
