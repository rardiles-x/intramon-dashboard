"use client";

import {
  Activity,
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  CloudCog,
  Database,
  Download,
  FileBarChart,
  FileClock,
  FileSpreadsheet,
  Gauge,
  Grid3X3,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  Menu,
  Moon,
  MoreHorizontal,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Save,
  Search,
  Server,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  TriangleAlert,
  Upload,
  UserCog,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import ProteksiDashboard from "./components/ProteksiDashboard";
import ThreeV0Dashboard from "./features/threev0/ThreeV0Dashboard";

type Status = "Normal" | "Warning" | "Critical";
type View =
  | "Dashboard Utama"
  | "Analytics"
  | "Data Spreadsheet"
  | "Import Data"
  | "Riwayat Sinkronisasi"
  | "Server Monitoring"
  | "Kesehatan Jaringan"
  | "Peta Monitoring"
  | "Proteksi Relai LCD"
  | "Monitoring 3V0"
  | "Pusat Notifikasi"
  | "Laporan Harian"
  | "Ketersediaan Sistem"
  | "Audit Log"
  | "Koneksi API"
  | "Pengguna & Akses"
  | "Preferensi";



type MonitoringRecord = {
  id: string;
  time: string;
  occurredAt?: string;
  source: string;
  description: string;
  status: Status;
  server: string;
};

type ServerRecord = {
  name: string;
  role: string;
  ip: string;
  status: string;
  cpu: number;
  ram: number;
  storage: number;
  uptime: number;
  responseMs: number;
};

type MapStatus = Status | "Offline";

type MapLocation = {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  status: MapStatus;
  server: string;
  lastUpdate: string;
};

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  view?: View;
  children?: Array<{ label: View; badge?: string }>;
};

const demoRows: MonitoringRecord[] = [
  { id: "MON-1248", time: "05 Agu 2026 · 08:42", source: "Data Operasional.xlsx", description: "Sinkronisasi selesai", status: "Normal", server: "SRV-INTRA-01" },
  { id: "MON-1247", time: "05 Agu 2026 · 08:28", source: "Penjualan Harian.xlsx", description: "Data penjualan berhasil diperbarui", status: "Normal", server: "SRV-INTRA-02" },
  { id: "MON-1246", time: "05 Agu 2026 · 08:15", source: "Inventori Gudang.xlsx", description: "12 baris memerlukan validasi", status: "Warning", server: "SRV-INTRA-01" },
  { id: "MON-1245", time: "05 Agu 2026 · 07:57", source: "Laporan Keuangan.xlsx", description: "Respons sumber melebihi 10 detik", status: "Critical", server: "SRV-INTRA-03" },
  { id: "MON-1244", time: "05 Agu 2026 · 07:42", source: "Data Absensi.xlsx", description: "Sinkronisasi selesai", status: "Normal", server: "SRV-INTRA-02" },
  { id: "MON-1243", time: "05 Agu 2026 · 07:20", source: "Rekap Pemeliharaan.xlsx", description: "Tidak ada perubahan data", status: "Normal", server: "SRV-INTRA-01" },
];

const demoServers: ServerRecord[] = [
  { name: "SRV-INTRA-01", role: "Primary Data Server", ip: "10.10.20.11", status: "Online", cpu: 42, ram: 61, storage: 73, uptime: 99.98, responseMs: 18 },
  { name: "SRV-INTRA-02", role: "Spreadsheet Worker", ip: "10.10.20.12", status: "Online", cpu: 28, ram: 49, storage: 58, uptime: 99.97, responseMs: 23 },
  { name: "SRV-INTRA-03", role: "Backup & Archive", ip: "10.10.20.13", status: "Online", cpu: 16, ram: 37, storage: 81, uptime: 99.96, responseMs: 31 },
];

const demoMapLocations: MapLocation[] = [
  { id: "LOC-001", name: "Node Surabaya", area: "Surabaya", latitude: -7.2575, longitude: 112.7521, status: "Normal", server: "SRV-INTRA-01", lastUpdate: "08:42 WIB" },
  { id: "LOC-002", name: "Node Gresik", area: "Gresik", latitude: -7.1566, longitude: 112.656, status: "Warning", server: "SRV-INTRA-02", lastUpdate: "08:28 WIB" },
  { id: "LOC-003", name: "Node Krian", area: "Sidoarjo", latitude: -7.4104, longitude: 112.5798, status: "Normal", server: "SRV-INTRA-01", lastUpdate: "08:15 WIB" },
  { id: "LOC-004", name: "Node Waru", area: "Sidoarjo", latitude: -7.3518, longitude: 112.738, status: "Critical", server: "SRV-INTRA-03", lastUpdate: "07:57 WIB" },
  { id: "LOC-005", name: "Node Malang", area: "Malang", latitude: -7.9666, longitude: 112.6326, status: "Normal", server: "SRV-INTRA-02", lastUpdate: "07:42 WIB" },
  { id: "LOC-006", name: "Node Denpasar", area: "Bali", latitude: -8.65, longitude: 115.2167, status: "Offline", server: "SRV-INTRA-04", lastUpdate: "06:50 WIB" },
];

const navigation: Array<{ section?: string; items: NavItem[] }> = [
  {
        section: "PROTEKSI",
        items: [
          {
            label: "Proteksi Relai LCD",
            icon: ShieldCheck,
            view: "Proteksi Relai LCD",
            badge: "Live",
          },
          {
            label: "Monitoring 3V0",
            icon: Gauge,
            view: "Monitoring 3V0",
            badge: "Live",
          },
        ],
      },
  {
        section: "SISTEM",
        items: [
          {
            label: "Pengaturan",
            icon: Settings,
            children: [
              { label: "Preferensi" },
            ],
          },
        ],
      },
];

const pageCopy: Record<View, { title: string; subtitle: string; parent: string }> = {
  "Dashboard Utama": { title: "Dashboard", subtitle: "Smart Monitoring for Reliable Protection", parent: "Dashboard" },
  Analytics: { title: "Analytics", subtitle: "Analisis tren, kualitas data, dan performa sumber", parent: "Dashboard" },
  "Data Spreadsheet": { title: "Data Spreadsheet", subtitle: "Telusuri dan validasi seluruh hasil sinkronisasi", parent: "Data & Integrasi" },
  "Import Data": { title: "Import Data", subtitle: "Tambahkan sumber monitoring melalui file CSV", parent: "Data & Integrasi" },
  "Riwayat Sinkronisasi": { title: "Riwayat Sinkronisasi", subtitle: "Status proses sinkronisasi dan koneksi sumber", parent: "Data & Integrasi" },
  "Server Monitoring": { title: "Server Monitoring", subtitle: "Kesehatan, kapasitas, dan performa server intranet", parent: "Infrastruktur" },
  "Kesehatan Jaringan": { title: "Kesehatan Jaringan", subtitle: "Ketersediaan jalur dan latensi antarlayanan", parent: "Infrastruktur" },
  "Peta Monitoring": { title: "Peta Monitoring", subtitle: "Sebaran lokasi dan status perangkat pada wilayah operasional", parent: "Infrastruktur" },
  "Proteksi Relai LCD": {
    title: "Proteksi Relai LCD",
    subtitle: "Monitoring penarikan indikasi FO Fail dan I Diff",
    parent: "Proteksi",
  },
  "Monitoring 3V0": {
    title: "Monitoring 3V0",
    subtitle: "Monitoring progress Penarikan Analog Tegangan dan Aktivasi 3V0 untuk Alarm OCR sisi LV Trafo",
    parent: "Proteksi",
  },
  "Pusat Notifikasi": { title: "Alert Center", subtitle: "Peringatan sistem yang memerlukan perhatian", parent: "Infrastruktur" },
  "Laporan Harian": { title: "Laporan Harian", subtitle: "Ringkasan aktivitas dan kondisi sistem hari ini", parent: "Pelaporan" },
  "Ketersediaan Sistem": { title: "Ketersediaan Sistem", subtitle: "Analisis uptime dan catatan downtime", parent: "Pelaporan" },
  "Audit Log": { title: "Audit Log", subtitle: "Jejak aktivitas administrator dan perubahan sistem", parent: "Pelaporan" },
  "Koneksi API": { title: "Koneksi API", subtitle: "Konfigurasi sumber data dan jadwal pembaruan", parent: "Sistem" },
  "Pengguna & Akses": { title: "Pengguna & Akses", subtitle: "Kelola peran dan otorisasi dashboard", parent: "Sistem" },
  Preferensi: { title: "Preferensi", subtitle: "Atur tampilan dan perilaku dashboard", parent: "Sistem" },
};

const sourceRows = [
  { name: "Data Operasional", file: "Data Operasional.xlsx", progress: 100, records: "4.820", status: "Sinkron" },
  { name: "Penjualan Harian", file: "Penjualan Harian.xlsx", progress: 96, records: "3.245", status: "Sinkron" },
  { name: "Inventori Gudang", file: "Inventori Gudang.xlsx", progress: 82, records: "2.106", status: "Validasi" },
  { name: "Laporan Keuangan", file: "Laporan Keuangan.xlsx", progress: 64, records: "1.294", status: "Terlambat" },
  { name: "Data Absensi", file: "Data Absensi.xlsx", progress: 100, records: "986", status: "Sinkron" },
];

const storageKeys = {
  apiUrl: "intramon-api-url",
  records: "intramon-records",
  servers: "intramon-servers",
  refreshSeconds: "intramon-refresh-seconds",
  autoRefresh: "intramon-auto-refresh",
} as const;

const normaliseApiBase = (value: string) => value.trim().replace(/\/+$/, "");
const apiEndpoint = (base: string, path: string) => `${normaliseApiBase(base)}/${path.replace(/^\/+/, "")}`;

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function StatusBadge({ status }: { status: Status }) {
  return <span className={`status status-${status.toLowerCase()}`}><i />{status}</span>;
}

function TrendChart({ range = "24 jam", compact = false }: { range?: string; compact?: boolean }) {
  const isLongRange = range !== "24 jam";
  const blue = isLongRange
    ? "52,174 110,165 168,181 226,128 284,115 342,76 400,92 458,52 516,74 574,65 632,96 690,70 744,83"
    : "52,182 110,194 168,154 226,120 284,86 342,102 400,67 458,52 516,95 574,96 632,78 690,138 744,111";
  return (
    <div className={`chart-wrap ${compact ? "compact" : ""}`} aria-label={`Grafik tren operasional ${range}`}>
      <svg viewBox="0 0 760 250" role="img" aria-labelledby="trend-title trend-desc">
        <title id="trend-title">Tren data masuk dan berhasil diproses</title>
        <desc id="trend-desc">Perbandingan volume data masuk dan data yang berhasil diproses.</desc>
        <defs><linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2c7be5" stopOpacity=".2" /><stop offset="100%" stopColor="#2c7be5" stopOpacity="0" /></linearGradient></defs>
        {[30, 75, 120, 165, 210].map((y) => <line key={y} x1="52" x2="744" y1={y} y2={y} className="grid-line" />)}
        <path className="area" d={`M${blue.replaceAll(" ", " L")} L744 210 L52 210 Z`} />
        <polyline className="line line-blue" points={blue} />
        <polyline className="line line-teal" points="52,198 110,204 168,194 226,180 284,159 342,140 400,151 458,131 516,140 574,151 632,157 690,145 744,154" />
        {[52, 168, 284, 400, 516, 632, 744].map((x, i) => <text key={x} x={x} y="238" textAnchor={i === 0 ? "start" : i === 6 ? "end" : "middle"} className="axis-label">{range === "24 jam" ? ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"][i] : ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"][i]}</text>)}
      </svg>
      {!compact && <div className="legend"><span><i className="legend-blue" />Data masuk</span><span><i className="legend-teal" />Berhasil diproses</span></div>}
    </div>
  );
}

function MiniBars({ values, tone = "blue" }: { values: number[]; tone?: string }) {
  return <div className={`mini-bars mini-${tone}`} aria-hidden="true">{values.map((value, index) => <i key={index} style={{ height: `${value}%` }} />)}</div>;
}

function MonitoringMap({ locations, selectedId, onSelect }: { locations: MapLocation[]; selectedId: string; onSelect: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRefs = useRef<Map<string, import("leaflet").CircleMarker>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const markerRegistry = markerRefs.current;

    const initialiseMap = async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      mapRef.current?.remove();
      markerRegistry.clear();
      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true, minZoom: 6 }).setView([-7.55, 113.1], 8);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const statusColors: Record<MapStatus, string> = { Normal: "#00d27a", Warning: "#f9a825", Critical: "#e63757", Offline: "#7d8998" };
      const bounds: Array<[number, number]> = [];
      locations.forEach((location) => {
        bounds.push([location.latitude, location.longitude]);
        const marker = L.circleMarker([location.latitude, location.longitude], {
          radius: 9,
          color: "#ffffff",
          weight: 3,
          fillColor: statusColors[location.status],
          fillOpacity: 1,
        }).addTo(map);
        const popup = document.createElement("div");
        popup.className = "map-popup";
        const title = document.createElement("strong");
        title.textContent = location.name;
        const detail = document.createElement("span");
        detail.textContent = `${location.area} · ${location.server}`;
        const state = document.createElement("small");
        state.textContent = `${location.status} · update ${location.lastUpdate}`;
        popup.append(title, detail, state);
        marker.bindPopup(popup).bindTooltip(location.name, { direction: "top", offset: [0, -8] });
        marker.on("click", () => onSelect(location.id));
        markerRegistry.set(location.id, marker);
      });
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [45, 45], maxZoom: 9 });
      window.setTimeout(() => map.invalidateSize(), 0);
    };

    void initialiseMap();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRegistry.clear();
    };
  }, [locations, onSelect]);

  useEffect(() => {
    const marker = markerRefs.current.get(selectedId);
    if (!marker || !mapRef.current) return;
    mapRef.current.flyTo(marker.getLatLng(), 11, { duration: 0.55 });
    marker.openPopup();
  }, [selectedId]);

  return <div ref={containerRef} className="monitoring-map" role="application" aria-label="Peta interaktif lokasi monitoring" />;
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>("Proteksi Relai LCD");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Pengaturan: false });
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState<"Semua" | Status>("Semua");
  const [mapStatusFilter, setMapStatusFilter] = useState<"Semua" | MapStatus>("Semua");
  const [selectedMapLocation, setSelectedMapLocation] = useState("LOC-001");
  const [dataRows, setDataRows] = useState<MonitoringRecord[]>(demoRows);
  const [servers, setServers] = useState<ServerRecord[]>(demoServers);
  const [lastSync, setLastSync] = useState("--:--:--");
  const [syncing, setSyncing] = useState(false);
  const [refreshSeconds, setRefreshSeconds] = useState(() => Number(window.localStorage.getItem(storageKeys.refreshSeconds)) || 30);
  const [autoRefresh, setAutoRefresh] = useState(() => window.localStorage.getItem(storageKeys.autoRefresh) !== "false");
  const [apiUrl, setApiUrl] = useState(() => window.localStorage.getItem(storageKeys.apiUrl) || import.meta.env.VITE_API_BASE_URL || "");
  const [unread, setUnread] = useState(3);
  const [toast, setToast] = useState("");
  const [darkMode, setDarkMode] = useState(false);


  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [chartRange, setChartRange] = useState("24 jam");
  const [sourceMode, setSourceMode] = useState<"api" | "local">("local");
  const [compactTable, setCompactTable] = useState(true);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }, []);

  const loadData = useCallback(async (preferredApiUrl?: string) => {
    const storedRows = readStored<MonitoringRecord[]>(storageKeys.records, []);
    const storedServers = readStored<ServerRecord[]>(storageKeys.servers, []);
    if (storedRows.length) setDataRows(storedRows);
    if (storedServers.length) setServers(storedServers);

    const base = normaliseApiBase(preferredApiUrl ?? window.localStorage.getItem(storageKeys.apiUrl) ?? import.meta.env.VITE_API_BASE_URL ?? "");
    if (!base) {
      setSourceMode("local");
      setLastSync(new Date().toLocaleTimeString("id-ID", { hour12: false }));
      return;
    }

    try {
      const [recordsResponse, serversResponse, settingsResponse] = await Promise.all([
        fetch(`${apiEndpoint(base, "monitoring")}?limit=500`, { cache: "no-store" }),
        fetch(apiEndpoint(base, "servers"), { cache: "no-store" }),
        fetch(apiEndpoint(base, "settings"), { cache: "no-store" }),
      ]);
      if (!recordsResponse.ok || !serversResponse.ok || !settingsResponse.ok) throw new Error("API belum tersedia");
      const recordPayload = await recordsResponse.json() as { records?: MonitoringRecord[] };
      const serverPayload = await serversResponse.json() as { servers?: ServerRecord[] };
      const settingsPayload = await settingsResponse.json() as { settings?: { refreshSeconds?: number; autoRefresh?: boolean } };
      if (recordPayload.records?.length) {
        setDataRows(recordPayload.records);
        window.localStorage.setItem(storageKeys.records, JSON.stringify(recordPayload.records));
      }
      if (serverPayload.servers?.length) {
        setServers(serverPayload.servers);
        window.localStorage.setItem(storageKeys.servers, JSON.stringify(serverPayload.servers));
      }
      if (settingsPayload.settings) {
        setRefreshSeconds(settingsPayload.settings.refreshSeconds ?? 30);
        setAutoRefresh(settingsPayload.settings.autoRefresh !== false);
      }
      setSourceMode("api");
      setLastSync(new Date().toLocaleTimeString("id-ID", { hour12: false }));
    } catch {
      setSourceMode("local");
      setLastSync(new Date().toLocaleTimeString("id-ID", { hour12: false }));
    }
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("intramon-theme");
    window.queueMicrotask(() => {
      setDarkMode(savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches));
      void loadData(apiUrl);
    });
  }, [loadData]);
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => void loadData(apiUrl), refreshSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, loadData, refreshSeconds]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleTheme = () => {
    setDarkMode((current) => {
      window.localStorage.setItem("intramon-theme", current ? "light" : "dark");
      return !current;
    });
  };



  const chooseView = (view: View) => {
    setActiveView(view);
    setMobileOpen(false);
    setNotificationOpen(false);
    setProfileOpen(false);
    setAppsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const syncNow = async () => {
    setSyncing(true);
    const base = normaliseApiBase(apiUrl);
    try {
      if (!base) throw new Error("API belum dikonfigurasi");
      const response = await fetch(apiEndpoint(base, "sync"), { method: "POST" });
      if (!response.ok) throw new Error("Sinkronisasi API belum tersedia");
      const payload = await response.json() as { imported?: number };
      await loadData(base);
      flash(payload.imported ? `${payload.imported} record berhasil disinkronkan` : "API berhasil diperbarui");
    } catch {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      setLastSync(new Date().toLocaleTimeString("id-ID", { hour12: false }));
      flash(base ? "API belum dapat dihubungi; data lokal tetap ditampilkan" : "Data lokal berhasil diperbarui");
    } finally { setSyncing(false); }
  };

  const saveSettings = async () => {
    const base = normaliseApiBase(apiUrl);
    window.localStorage.setItem(storageKeys.apiUrl, base);
    window.localStorage.setItem(storageKeys.refreshSeconds, String(refreshSeconds));
    window.localStorage.setItem(storageKeys.autoRefresh, String(autoRefresh));
    setApiUrl(base);
    if (!base) {
      setSourceMode("local");
      flash("Pengaturan tersimpan di browser");
      return;
    }
    try {
      const response = await fetch(apiEndpoint(base, "settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshSeconds, autoRefresh }),
      });
      if (!response.ok) throw new Error("Pengaturan gagal disimpan");
      setSourceMode("api");
      flash("Pengaturan tersimpan di API dan browser");
    } catch {
      setSourceMode("local");
      flash("API belum dapat dihubungi; pengaturan tersimpan di browser");
    }
  };

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return flash("File CSV tidak memiliki baris data");
    const delimiter = lines[0].includes(";") ? ";" : ",";
    const imported: MonitoringRecord[] = lines.slice(1).map((line, index) => {
      const cells = line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ""));
      const rawStatus = (cells[4] || "Normal").toLowerCase();
      return {
        id: cells[0] || `IMP-${Date.now()}-${index + 1}`,
        time: cells[1] || new Date().toLocaleString("id-ID"),
        occurredAt: new Date().toISOString(),
        source: cells[2] || file.name,
        description: cells[3] || "Data berhasil diimpor",
        status: rawStatus.includes("critical") ? "Critical" : rawStatus.includes("warning") ? "Warning" : "Normal",
        server: cells[5] || "UPLOAD-LOCAL",
      };
    });
    const merged = [...imported, ...dataRows.filter((row) => !imported.some((item) => item.id === row.id))];
    setDataRows(merged);
    window.localStorage.setItem(storageKeys.records, JSON.stringify(merged));
    const base = normaliseApiBase(apiUrl);
    try {
      if (!base) throw new Error("API belum dikonfigurasi");
      const response = await fetch(apiEndpoint(base, "monitoring"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: imported }) });
      if (!response.ok) throw new Error("Database belum tersedia");
      await loadData(base);
      setSourceMode("api");
    } catch { setSourceMode("local"); }
    chooseView("Data Spreadsheet");
    flash(`${imported.length} baris berhasil diimpor`);
    event.target.value = "";
  };

  const downloadTemplate = () => {
    const csv = "ID,Waktu,Sumber,Deskripsi,Status,Server\nMON-001,05/08/2026 08:00,Data Operasional.xlsx,Sinkronisasi selesai,Normal,SRV-INTRA-01\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "template-monitoring.csv";
    link.click();
    URL.revokeObjectURL(url);
    flash("Template CSV berhasil diunduh");
  };

  const filteredRows = useMemo(() => dataRows.filter((row) => {
    const matchesQuery = Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === "Semua" || row.status === statusFilter);
  }), [dataRows, query, statusFilter]);

  const counts = useMemo(() => ({
    total: dataRows.length,
    normal: dataRows.filter((row) => row.status === "Normal").length,
    warning: dataRows.filter((row) => row.status === "Warning").length,
    critical: dataRows.filter((row) => row.status === "Critical").length,
  }), [dataRows]);

  const visibleMapLocations = useMemo(
    () => demoMapLocations.filter((location) => mapStatusFilter === "Semua" || location.status === mapStatusFilter),
    [mapStatusFilter],
  );

  const onlineCount = servers.filter((server) => server.status === "Online").length;
  const averageResponse = Math.round(servers.reduce((sum, server) => sum + server.responseMs, 0) / Math.max(servers.length, 1));

  const exportRows = () => {
    const header = "ID,Waktu,Sumber,Deskripsi,Status,Server";
    const csv = [header, ...filteredRows.map((row) => [row.id, row.time, row.source, row.description, row.status, row.server].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "monster-monitoring.csv";
    link.click();
    URL.revokeObjectURL(url);
    flash("Laporan CSV berhasil disiapkan");
  };

  const renderTable = (limit?: number) => {
    const displayedRows = typeof limit === "number" ? filteredRows.slice(0, limit) : filteredRows;
    return <>
      <div className={`table-scroll ${compactTable ? "compact-table" : ""}`}>
        <table><thead><tr><th>ID Monitoring</th><th>Waktu update</th><th>Sumber data</th><th>Deskripsi</th><th>Status</th><th>Server</th><th aria-label="Aksi" /></tr></thead>
          <tbody>{displayedRows.map((row) => <tr key={row.id}><td className="mono">{row.id}</td><td><Clock3 size={13} />{row.time}</td><td><span className="excel-icon">X</span>{row.source}</td><td>{row.description}</td><td><StatusBadge status={row.status} /></td><td className="server-name">{row.server}</td><td><button className="row-action" type="button" aria-label={`Aksi ${row.id}`}><MoreHorizontal size={16} /></button></td></tr>)}</tbody>
        </table>
      </div>
      {displayedRows.length === 0 && <div className="empty-state"><Search size={26} /><strong>Data tidak ditemukan</strong><span>Coba ubah kata kunci atau filter status.</span></div>}
    </>;
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const containsActive = item.children?.some((child) => child.label === activeView) || item.view === activeView;
    const open = openGroups[item.label] ?? false;
    return <div className={`nav-item-wrap ${containsActive ? "contains-active" : ""}`} key={item.label}>
      <button
        className={`nav-item ${item.view === activeView ? "active" : ""}`}
        type="button"
        title={collapsed ? item.label : undefined}
        onClick={() => {
          if (item.children) setOpenGroups((current) => ({ ...current, [item.label]: !open }));
          else if (item.view) {
            if (item.label === "Sinkronkan Sekarang") void syncNow();
            chooseView(item.view);
          }
        }}
      >
        <Icon size={16} /><span>{item.label}</span>{item.badge && <b className={item.badge === "Live" ? "badge-live" : ""}>{item.badge === "3" ? unread : item.badge}</b>}{item.children && <ChevronDown className={`nav-chevron ${open ? "open" : ""}`} size={13} />}
      </button>
      {item.children && open && !collapsed && <div className="nav-children">{item.children.map((child) => <button key={child.label} type="button" className={activeView === child.label ? "active" : ""} onClick={() => chooseView(child.label)}><span />{child.label}{child.badge && <b>{child.badge}</b>}</button>)}</div>}
    </div>;
  };

  const dataActions = <div className="action-row"><button className="secondary-action" type="button" onClick={exportRows}><Download size={14} />Export</button><label className="primary-action"><Upload size={14} />Import CSV<input type="file" accept=".csv,text/csv" onChange={importCsv} /></label></div>;

  return (
    <div className={`app-shell ${darkMode ? "theme-dark" : ""} ${collapsed ? "is-collapsed" : ""}`} data-accent="blue">
      {mobileOpen && <button className="sidebar-scrim" aria-label="Tutup navigasi" type="button" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="brand-row">
          <button className="brand" type="button" onClick={() => chooseView("Proteksi Relai LCD")} aria-label="Buka Proteksi Relai LCD">
  <span className="brand-mark"><Activity size={27} /></span>
  <span className="brand-copy">
    <span className="brand-name">MON<span>STER</span></span>
    <span className="brand-expansion">(Monitoring Sistem Proteksi Terintegrasi)</span>
    <span className="brand-tagline">Smart Monitoring for Reliable Protection</span>
  </span>
</button>
          <button className="sidebar-close" type="button" aria-label="Tutup navigasi" onClick={() => setMobileOpen(false)}><X size={19} /></button>
        </div>
        <nav aria-label="Navigasi utama">
          {navigation.map((group, index) => <div className="nav-group" key={group.section ?? index}>{group.section && <span className="nav-section">{group.section}</span>}{group.items.map(renderNavItem)}</div>)}
        </nav>
        <div className="sidebar-footer"><span className="server-ring"><Server size={17} /></span><span><strong>{onlineCount}/{servers.length} server online</strong><small>Terakhir cek {lastSync} WIB</small></span><i className="server-dot" /></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" type="button" aria-label={collapsed ? "Perbesar sidebar" : "Perkecil sidebar"} onClick={() => setCollapsed((value) => !value)}>{collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}</button>
            <button className="mobile-menu" type="button" aria-label="Buka navigasi" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <label className="search-box"><Search size={16} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." aria-label="Cari data" /><kbd>Ctrl K</kbd></label>
          </div>
          <div className="top-actions">
            <button className="top-icon" type="button" aria-label={darkMode ? "Gunakan mode terang" : "Gunakan mode gelap"} onClick={toggleTheme}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button className="top-icon" type="button" aria-label="Sinkronkan data" onClick={syncNow}><RefreshCw size={17} className={syncing ? "spin" : ""} /></button>
            <div className="popover-wrap"><button className="top-icon" type="button" aria-label="Buka notifikasi" aria-expanded={notificationOpen} onClick={() => { setNotificationOpen((value) => !value); setProfileOpen(false); setAppsOpen(false); }}><Bell size={18} />{unread > 0 && <i>{unread}</i>}</button>{notificationOpen && <div className="popover notification-popover"><div className="popover-head"><strong>Notifications</strong><button type="button" onClick={() => setUnread(0)}>Tandai dibaca</button></div><div className="mini-notice critical"><CircleAlert size={17} /><span><strong>Koneksi sumber melambat</strong><small>SRV-INTRA-03 · 07:57 WIB</small></span></div><div className="mini-notice warning"><TriangleAlert size={17} /><span><strong>12 baris perlu validasi</strong><small>Inventori Gudang.xlsx</small></span></div><button className="popover-link" type="button" onClick={() => chooseView("Pusat Notifikasi")}>Lihat semua notifikasi <ChevronRight size={14} /></button></div>}</div>
            <div className="popover-wrap"><button className="top-icon" type="button" aria-label="Buka menu cepat" aria-expanded={appsOpen} onClick={() => { setAppsOpen((value) => !value); setNotificationOpen(false); setProfileOpen(false); }}><Grid3X3 size={18} /></button>{appsOpen && <div className="popover quick-popover"><strong>Quick access</strong><div>{[{ label: "Data", icon: FileSpreadsheet, view: "Data Spreadsheet" as View }, { label: "Server", icon: Server, view: "Server Monitoring" as View }, { label: "Laporan", icon: FileBarChart, view: "Laporan Harian" as View }, { label: "Settings", icon: Settings, view: "Koneksi API" as View }].map(({ label, icon: Icon, view }) => <button key={label} type="button" onClick={() => chooseView(view)}><Icon size={18} /><span>{label}</span></button>)}</div></div>}</div>
            <div className="popover-wrap"><button className="profile-button" type="button" aria-label="Buka profil" aria-expanded={profileOpen} onClick={() => { setProfileOpen((value) => !value); setNotificationOpen(false); setAppsOpen(false); }}><span className="avatar">AD</span></button>{profileOpen && <div className="popover profile-popover"><div className="profile-summary"><span className="avatar">AD</span><span><strong>Administrator</strong><small>System Admin</small></span></div><button type="button" onClick={() => chooseView("Pengguna & Akses")}><UserCog size={15} />Profil & akses</button><button type="button" onClick={() => chooseView("Preferensi")}><Settings size={15} />Preferensi</button></div>}</div>
          </div>
        </header>

        <div className={`page-toolbar ${activeView === "Proteksi Relai LCD" ? "proteksi-lcd-heading" : ""}`}>
          <div><div className="breadcrumb"><span>{pageCopy[activeView].parent}</span><ChevronRight size={11} /><span>{pageCopy[activeView].title}</span></div><h1>{pageCopy[activeView].title}</h1><p className={activeView === "Monitoring 3V0" ? "threev0-page-subtitle" : undefined}>{pageCopy[activeView].subtitle}</p></div>
          <div className="live-state"><span className="server-dot" /><span><strong>Live monitoring</strong><small>{sourceMode === "api" ? "API eksternal terhubung" : "Mode lokal browser"}</small></span></div>
        </div>

        {activeView === "Dashboard Utama" && <section className="dashboard-grid content-view">
          <article className="panel metric-card metric-wide"><div><span>Total Data Hari Ini <CircleAlert size={12} /></span><strong>{Math.max(counts.total, 1248).toLocaleString("id-ID")}</strong><small><b>+12,5%</b> dari kemarin</small></div><MiniBars values={[38, 52, 48, 62, 57, 74, 70]} /></article>
          <article className="panel metric-card metric-wide"><div><span>Berhasil Diproses <CircleAlert size={12} /></span><strong>{counts.total ? Math.round((counts.normal / counts.total) * 100) : 98}<em>%</em></strong><small><b className="blue-text">+2,1%</b> tingkat keberhasilan</small></div><TrendChart compact /></article>

          <article className="panel status-share"><div className="panel-head"><div><h2>Status Data</h2><p>Distribusi data hari ini</p></div><button className="row-action" type="button" aria-label="Menu status"><MoreHorizontal size={17} /></button></div><div className="share-body"><div className="donut" style={{ background: `conic-gradient(#2c7be5 0 ${Math.max(72, counts.normal)}%, #27bcfd ${Math.max(72, counts.normal)}% 89%, #e63757 89% 100%)` }}><span><strong>{counts.total || 1248}</strong><small>Records</small></span></div><div className="share-list"><span><i className="dot-blue" />Normal<strong>{counts.normal || 1096}</strong><small>87,8%</small></span><span><i className="dot-cyan" />Warning<strong>{counts.warning || 118}</strong><small>9,5%</small></span><span><i className="dot-red" />Critical<strong>{counts.critical || 34}</strong><small>2,7%</small></span></div></div></article>
          <article className="panel server-weather"><div className="panel-head"><div><h2>Kondisi Server</h2><p>Pembaruan real-time</p></div><button className="row-action" type="button" aria-label="Menu server"><MoreHorizontal size={17} /></button></div><div className="weather-body"><span className="server-sun"><Server size={35} /><i /></span><span><strong>{onlineCount}/{servers.length}</strong><small>Server online</small><em>Uptime 99,97%</em></span><div><strong>{averageResponse}<small> ms</small></strong><span>Response time</span></div></div></article>

          <article className="panel running-sources"><div className="panel-head"><div><h2>Sumber Data Aktif</h2><p>Progres sinkronisasi terbaru</p></div><select aria-label="Urutkan sumber"><option>Hari ini</option><option>7 hari</option></select></div><div className="source-list">{sourceRows.map((source, index) => <div className="source-row" key={source.name}><span className={`source-avatar tone-${index + 1}`}>{source.name.charAt(0)}</span><span><strong>{source.name}</strong><small>{source.file}</small></span><em>{source.records} rows</em><span className="source-progress"><i style={{ width: `${source.progress}%` }} /></span><b>{source.progress}%</b></div>)}</div><button className="panel-link" type="button" onClick={() => chooseView("Data Spreadsheet")}>Tampilkan semua sumber <ChevronRight size={13} /></button></article>
          <article className="panel total-sync"><div className="panel-head"><div><h2>Tren Sinkronisasi</h2><p>Volume data berhasil diproses</p></div><div className="head-actions"><select value={chartRange} onChange={(event) => setChartRange(event.target.value)} aria-label="Rentang grafik"><option>24 jam</option><option>7 hari</option><option>30 hari</option></select><button className="row-action" type="button" aria-label="Menu grafik"><MoreHorizontal size={17} /></button></div></div><TrendChart range={chartRange} /></article>

          <article className="panel storage-card"><div className="storage-copy"><span>Menggunakan Storage <strong>724 GB</strong> dari 1 TB</span><div className="storage-bar"><i /><i /><i /></div><div className="storage-legend"><span><i className="dot-blue" />Database</span><span><i className="dot-cyan" />Spreadsheet</span><span><i className="dot-green" />Backup</span><span><i className="dot-empty" />Free</span></div></div></article>
          <article className="panel upgrade-card"><div><strong>Perlu perhatian?</strong><p>Ada {counts.warning + counts.critical || 2} aktivitas yang membutuhkan tindak lanjut operator.</p><button type="button" onClick={() => chooseView("Pusat Notifikasi")}>Buka Alert Center <ChevronRight size={13} /></button></div><span><BellRing size={38} /></span></article>
        </section>}

        {activeView === "Analytics" && <section className="content-view analytics-view"><div className="kpi-strip">{[
          { label: "Total record", value: Math.max(counts.total, 1248).toLocaleString("id-ID"), hint: "+12,5%", icon: Database, tone: "blue" },
          { label: "Success rate", value: "98,2%", hint: "+2,1%", icon: CheckCircle2, tone: "green" },
          { label: "Avg. response", value: `${averageResponse} ms`, hint: "-4 ms", icon: Zap, tone: "amber" },
          { label: "Issues", value: String(counts.warning + counts.critical || 2), hint: "Perlu cek", icon: TriangleAlert, tone: "red" },
        ].map(({ label, value, hint, icon: Icon, tone }) => <article className="panel analytic-kpi" key={label}><span className={`analytic-icon ${tone}`}><Icon size={18} /></span><span><small>{label}</small><strong>{value}</strong></span><em>{hint}</em></article>)}</div><div className="analytics-grid"><article className="panel analytics-chart"><div className="panel-head"><div><h2>Volume & Kualitas Data</h2><p>Perbandingan data masuk dan lolos validasi</p></div><select value={chartRange} onChange={(event) => setChartRange(event.target.value)}><option>24 jam</option><option>7 hari</option><option>30 hari</option></select></div><TrendChart range={chartRange} /></article><article className="panel quality-panel"><div className="panel-head"><div><h2>Performa Sumber</h2><p>Persentase keberhasilan proses</p></div></div><div className="quality-list">{sourceRows.map((source) => <div key={source.name}><span><strong>{source.name}</strong><em>{source.progress}%</em></span><div className="progress"><i style={{ width: `${source.progress}%` }} /></div></div>)}</div></article></div></section>}

        {activeView === "Data Spreadsheet" && <section className="content-view"><div className="view-actions"><div className="filter-tabs" aria-label="Filter status">{(["Semua", "Normal", "Warning", "Critical"] as const).map((status) => <button key={status} className={statusFilter === status ? "active" : ""} onClick={() => setStatusFilter(status)} type="button">{status}</button>)}</div>{dataActions}</div><article className="panel data-panel"><div className="panel-head"><div><h2>Seluruh Data Spreadsheet</h2><p>Data tersimpan dari seluruh sumber monitoring</p></div><div className="head-actions"><span className="record-count">{filteredRows.length} record</span><button className="row-action" type="button" aria-label="Ubah kepadatan tabel" onClick={() => setCompactTable((value) => !value)}><SlidersHorizontal size={15} /></button></div></div>{renderTable()}</article></section>}

        {activeView === "Import Data" && <section className="content-view import-grid"><article className="panel import-card"><span className="import-icon"><Upload size={27} /></span><h2>Import file monitoring</h2><p>Tarik file CSV ke area ini atau pilih file dari komputer Anda.</p><label className="primary-action large"><FileSpreadsheet size={16} />Pilih file CSV<input type="file" accept=".csv,text/csv" onChange={importCsv} /></label><small>Maksimal 10 MB · UTF-8 · delimiter koma atau titik koma</small></article><article className="panel format-card"><div className="panel-head"><div><h2>Format yang dibutuhkan</h2><p>Pastikan susunan kolom sesuai template</p></div><FileSpreadsheet size={22} /></div><ol><li><span>1</span><div><strong>ID & waktu</strong><small>Identitas record dan waktu kejadian</small></div></li><li><span>2</span><div><strong>Sumber & deskripsi</strong><small>Nama file serta ringkasan aktivitas</small></div></li><li><span>3</span><div><strong>Status & server</strong><small>Normal/Warning/Critical dan nama server</small></div></li></ol><button className="secondary-action" type="button" onClick={downloadTemplate}>Unduh template</button></article><article className="panel recent-imports"><div className="panel-head"><div><h2>Import terakhir</h2><p>Aktivitas unggah file terbaru</p></div></div>{sourceRows.slice(0, 4).map((source, index) => <div className="import-row" key={source.name}><span className="excel-icon">X</span><span><strong>{source.file}</strong><small>Hari ini · 0{8 - index}:2{index} WIB</small></span><em>{source.records} rows</em><CheckCircle2 size={16} /></div>)}</article></section>}

        {activeView === "Riwayat Sinkronisasi" && <section className="content-view"><div className="view-actions"><div className="sync-summary"><RefreshCw size={18} /><span><strong>Sinkronisasi terakhir {lastSync} WIB</strong><small>{sourceMode === "api" ? "SQLite dan REST API intranet aktif" : "Data tersimpan lokal di browser"}</small></span></div><button className="primary-action" type="button" onClick={syncNow}><RefreshCw size={14} className={syncing ? "spin" : ""} />Sinkronkan sekarang</button></div><article className="panel history-panel"><div className="panel-head"><div><h2>Aktivitas Sinkronisasi</h2><p>Riwayat proses dari seluruh sumber</p></div><span className="healthy"><Check size={13} />Operasional</span></div><div className="timeline">{sourceRows.map((source, index) => <div className="timeline-row" key={source.name}><span className={index === 3 ? "warning" : "success"}><CheckCircle2 size={15} /></span><div><strong>{source.name}</strong><p>{index === 3 ? "Sinkronisasi selesai dengan respons lambat" : "Data berhasil diperbarui dan divalidasi"}</p><small>05 Agustus 2026 · 0{8 - index}:{42 - index * 5} WIB</small></div><em>{source.records} records</em></div>)}</div></article></section>}

        {activeView === "Server Monitoring" && <section className="content-view"><div className="server-summary"><div><span className="server-summary-icon"><Network size={21} /></span><span><small>STATUS JARINGAN</small><strong>{onlineCount}/{servers.length} server online</strong></span></div><div><small>Ketersediaan 30 hari</small><strong>99,97%</strong></div><div><small>Rata-rata respons</small><strong>{averageResponse} ms</strong></div></div><div className="server-grid">{servers.map((server) => <article className="panel server-card" key={server.name}><div className="server-card-head"><span className="server-illustration"><Server size={22} /></span><div><h2>{server.name}</h2><p>{server.role}</p></div><span className={`online-badge ${server.status !== "Online" ? "offline" : ""}`}><Wifi size={11} />{server.status}</span></div><div className="server-meta"><span>IP Address<strong>{server.ip}</strong></span><span>Uptime<strong>{server.uptime}%</strong></span><span>Respons<strong>{server.responseMs} ms</strong></span></div>{[{ label: "CPU", value: server.cpu }, { label: "RAM", value: server.ram }, { label: "Storage", value: server.storage }].map((metric) => <div className="metric-row" key={metric.label}><span>{metric.label}</span><div className="progress"><i style={{ width: `${metric.value}%` }} /></div><strong>{metric.value}%</strong></div>)}</article>)}</div></section>}

        {activeView === "Kesehatan Jaringan" && <section className="content-view network-view"><article className="panel network-map"><div className="panel-head"><div><h2>Topologi Layanan</h2><p>Status koneksi antarkomponen intranet</p></div><span className="healthy"><Check size={13} />Semua jalur aktif</span></div><div className="network-flow"><div><span><Database size={21} /></span><strong>SQLite Intranet</strong><small>12 ms</small></div><i /><div><span><CloudCog size={21} /></span><strong>REST API Mandiri</strong><small>18 ms</small></div><i /><div><span><Server size={21} /></span><strong>Server Intranet</strong><small>23 ms</small></div><i /><div><span><FileSpreadsheet size={21} /></span><strong>Spreadsheet</strong><small>31 ms</small></div></div></article><div className="network-cards">{[{ label: "Packet loss", value: "0,02%", hint: "Sangat baik", icon: Activity }, { label: "Avg. latency", value: `${averageResponse} ms`, hint: "Dalam batas normal", icon: Zap }, { label: "Throughput", value: "842 Mbps", hint: "84% kapasitas", icon: Gauge }].map(({ label, value, hint, icon: Icon }) => <article className="panel network-card" key={label}><span><Icon size={19} /></span><div><small>{label}</small><strong>{value}</strong><em>{hint}</em></div></article>)}</div></section>}

        {activeView === "Peta Monitoring" && <section className="content-view map-view"><div className="view-actions"><div className="map-summary"><MapPinned size={19} /><span><strong>{visibleMapLocations.length} lokasi ditampilkan</strong><small>Data contoh · siap dihubungkan ke REST API intranet</small></span></div><div className="map-legend"><span><i className="normal" />Normal</span><span><i className="warning" />Warning</span><span><i className="critical" />Critical</span><span><i className="offline" />Offline</span></div></div><div className="map-layout"><article className="panel map-panel"><div className="panel-head"><div><h2>Wilayah Operasional</h2><p>Pilih marker untuk melihat detail lokasi</p></div><div className="filter-tabs map-filters" aria-label="Filter status lokasi">{(["Semua", "Normal", "Warning", "Critical", "Offline"] as const).map((status) => <button key={status} className={mapStatusFilter === status ? "active" : ""} type="button" onClick={() => setMapStatusFilter(status)}>{status}</button>)}</div></div><MonitoringMap locations={visibleMapLocations} selectedId={selectedMapLocation} onSelect={setSelectedMapLocation} /></article><aside className="panel map-location-panel"><div className="panel-head"><div><h2>Daftar Lokasi</h2><p>Status pembaruan terakhir</p></div></div><div className="map-location-list">{visibleMapLocations.map((location) => <button className={selectedMapLocation === location.id ? "active" : ""} key={location.id} type="button" onClick={() => setSelectedMapLocation(location.id)}><span className={`map-pin-dot ${location.status.toLowerCase()}`} /><span><strong>{location.name}</strong><small>{location.area} · {location.server}</small></span><span><b>{location.status}</b><small>{location.lastUpdate}</small></span></button>)}</div>{visibleMapLocations.length === 0 && <div className="empty-state"><MapPinned size={26} /><strong>Lokasi tidak ditemukan</strong><span>Pilih status lain untuk menampilkan marker.</span></div>}</aside></div></section>}

        {activeView === "Proteksi Relai LCD" && <ProteksiDashboard />}
        {activeView === "Monitoring 3V0" && <ThreeV0Dashboard />}
        {activeView === "Pusat Notifikasi" && <section className="content-view"><div className="view-actions"><div className="notification-summary"><BellRing size={19} /><span><strong>{unread} notifikasi belum dibaca</strong><small>Peringatan sistem selama 24 jam terakhir</small></span></div><button className="secondary-action" type="button" onClick={() => { setUnread(0); flash("Semua notifikasi ditandai dibaca"); }}><Check size={14} />Tandai semua dibaca</button></div><div className="notification-list"><article className="notification critical"><span><CircleAlert size={18} /></span><div><h3>Koneksi sumber melambat</h3><p>Laporan Keuangan.xlsx membutuhkan waktu respons lebih dari 10 detik.</p><small>SRV-INTRA-03 · 07:57 WIB</small></div><StatusBadge status="Critical" /></article><article className="notification warning"><span><TriangleAlert size={18} /></span><div><h3>Data tidak valid ditemukan</h3><p>12 baris pada Inventori Gudang.xlsx memerlukan pemeriksaan.</p><small>SRV-INTRA-01 · 08:15 WIB</small></div><StatusBadge status="Warning" /></article><article className="notification normal"><span><CheckCircle2 size={18} /></span><div><h3>Sinkronisasi harian selesai</h3><p>Semua data operasional berhasil diperbarui tanpa kendala.</p><small>SRV-INTRA-01 · 08:42 WIB</small></div><StatusBadge status="Normal" /></article></div></section>}

        {activeView === "Laporan Harian" && <section className="content-view"><div className="view-actions"><div className="report-date"><FileClock size={18} /><span><strong>Rabu, 5 Agustus 2026</strong><small>Laporan operasional otomatis</small></span></div>{dataActions}</div><div className="report-grid">{[{ label: "Data diproses", value: "12.451", icon: Database }, { label: "Sumber aktif", value: "8/8", icon: FileSpreadsheet }, { label: "Server online", value: `${onlineCount}/${servers.length}`, icon: Server }, { label: "Alert terbuka", value: String(counts.warning + counts.critical || 2), icon: BellRing }].map(({ label, value, icon: Icon }) => <article className="panel report-card" key={label}><span><Icon size={18} /></span><small>{label}</small><strong>{value}</strong></article>)}</div><article className="panel daily-report"><div className="panel-head"><div><h2>Ringkasan Aktivitas</h2><p>Kondisi sistem berdasarkan pembaruan hari ini</p></div><span className="healthy"><Check size={13} />Stabil</span></div>{renderTable(6)}</article></section>}

        {activeView === "Ketersediaan Sistem" && <section className="content-view availability-view"><article className="panel availability-hero"><span className="availability-ring"><strong>99,97%</strong><small>Uptime</small></span><div><span>KETERSEDIAAN 30 HARI</span><h2>Sistem beroperasi sangat baik</h2><p>Total downtime tercatat 12 menit dan tidak ada gangguan aktif saat ini.</p><div><b><CheckCircle2 size={14} />SLA target 99,90%</b><b><Zap size={14} />MTTR 4 menit</b></div></div></article><article className="panel availability-table"><div className="panel-head"><div><h2>Uptime per Server</h2><p>Periode 30 hari terakhir</p></div></div><div className="availability-rows">{servers.map((server) => <div key={server.name}><span className="server-illustration"><Server size={18} /></span><span><strong>{server.name}</strong><small>{server.role}</small></span><div className="progress"><i style={{ width: `${server.uptime}%` }} /></div><b>{server.uptime}%</b><span className="online-badge"><Wifi size={11} />Online</span></div>)}</div></article></section>}

        {activeView === "Audit Log" && <section className="content-view"><article className="panel audit-panel"><div className="panel-head"><div><h2>Aktivitas Administrator</h2><p>Jejak perubahan dan akses sistem</p></div><span className="record-count">24 jam</span></div><div className="audit-list">{[
          { user: "Administrator", action: "Menjalankan sinkronisasi manual", target: "Semua sumber data", time: "08:42 WIB", icon: RefreshCw },
          { user: "System Service", action: "Memperbarui status server", target: "SRV-INTRA-01", time: "08:30 WIB", icon: Server },
          { user: "Administrator", action: "Mengimpor file spreadsheet", target: "Inventori Gudang.xlsx", time: "08:15 WIB", icon: Upload },
          { user: "System Service", action: "Membuat notifikasi critical", target: "Laporan Keuangan.xlsx", time: "07:57 WIB", icon: BellRing },
          { user: "Administrator", action: "Mengubah interval refresh", target: "30 detik", time: "Kemarin", icon: Settings },
        ].map(({ user, action, target, time, icon: Icon }) => <div className="audit-row" key={`${action}-${time}`}><span><Icon size={16} /></span><div><strong>{action}</strong><p><b>{user}</b> · {target}</p></div><small>{time}</small></div>)}</div></article></section>}

        {activeView === "Koneksi API" && <section className="content-view settings-grid"><article className="panel settings-card"><div className="settings-title"><span><CloudCog size={19} /></span><div><h2>Koneksi sumber</h2><p>Endpoint REST API mandiri pada server intranet</p></div></div><label className="field-label">Base URL API<input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} placeholder="http://192.168.1.10:8787/api" /></label><div className="connection-test"><span className="server-dot" /><span><strong>{sourceMode === "api" ? "API dan SQLite terhubung" : "Mode lokal browser"}</strong><small>{sourceMode === "api" ? "Data persisten tersedia di server intranet" : "Isi Base URL untuk data real-time bersama"}</small></span><button type="button" onClick={() => void loadData(apiUrl)}>Uji koneksi</button></div></article><article className="panel settings-card"><div className="settings-title"><span><RefreshCw size={19} /></span><div><h2>Sinkronisasi otomatis</h2><p>Interval pembaruan dashboard</p></div></div><label className="field-label">Interval refresh<select value={refreshSeconds} onChange={(event) => setRefreshSeconds(Number(event.target.value))}><option value={15}>15 detik</option><option value={30}>30 detik</option><option value={60}>1 menit</option><option value={300}>5 menit</option></select></label><div className="setting-toggle"><span><strong>Monitoring real-time</strong><small>Perbarui tampilan secara otomatis</small></span><button className={`toggle ${autoRefresh ? "on" : ""}`} aria-label="Ubah monitoring real-time" type="button" onClick={() => setAutoRefresh((value) => !value)}><i /></button></div></article><article className="panel settings-card wide"><div className="settings-title"><span><ShieldCheck size={19} /></span><div><h2>Keamanan koneksi</h2><p>Konfigurasi pada hosting dan server intranet</p></div></div><div className="security-row"><span><CheckCircle2 size={17} /><span><strong>Tanpa layanan ChatGPT</strong><small>Frontend berjalan di GitHub Pages dan API berjalan di server Anda.</small></span></span><span><CheckCircle2 size={17} /><span><strong>HTTPS direkomendasikan</strong><small>Gunakan reverse proxy atau VPN saat API diakses dari luar intranet.</small></span></span></div><button className="primary-action save-action" type="button" onClick={saveSettings}><Save size={14} />Simpan pengaturan</button></article></section>}

        {activeView === "Pengguna & Akses" && <section className="content-view users-view"><div className="view-actions"><div className="users-summary"><Users size={19} /><span><strong>4 pengguna aktif</strong><small>Hak akses dashboard intranet</small></span></div><button className="primary-action" type="button" onClick={() => flash("Form pengguna baru siap dibuka")}><Users size={14} />Tambah pengguna</button></div><article className="panel users-panel"><div className="panel-head"><div><h2>Daftar Pengguna</h2><p>Peran dan status akses sistem</p></div></div><div className="user-list">{[
          { initials: "AD", name: "Administrator", email: "admin@intranet.local", role: "System Admin", status: "Aktif" },
          { initials: "OP", name: "Operator Monitoring", email: "operator@intranet.local", role: "Operator", status: "Aktif" },
          { initials: "AN", name: "Data Analyst", email: "analyst@intranet.local", role: "Analyst", status: "Aktif" },
          { initials: "VW", name: "Viewer Management", email: "viewer@intranet.local", role: "Viewer", status: "Aktif" },
        ].map((user) => <div className="user-row" key={user.email}><span className="avatar">{user.initials}</span><span><strong>{user.name}</strong><small>{user.email}</small></span><em>{user.role}</em><span className="online-badge"><Check size={11} />{user.status}</span><button className="row-action" type="button" aria-label={`Atur ${user.name}`}><MoreHorizontal size={16} /></button></div>)}</div></article></section>}

        {activeView === "Preferensi" && <section className="content-view settings-grid"><article className="panel settings-card"><div className="settings-title"><span><Sun size={19} /></span><div><h2>Tampilan</h2><p>Tema antarmuka dashboard</p></div></div><div className="theme-options"><button className={!darkMode ? "active" : ""} type="button" onClick={() => darkMode && toggleTheme()}><Sun size={19} /><span><strong>Light</strong><small>Tampilan terang</small></span></button><button className={darkMode ? "active" : ""} type="button" onClick={() => !darkMode && toggleTheme()}><Moon size={19} /><span><strong>Dark</strong><small>Tampilan gelap</small></span></button></div></article><article className="panel settings-card"><div className="settings-title"><span><ListChecks size={19} /></span><div><h2>Kepadatan data</h2><p>Ukuran baris tabel monitoring</p></div></div><div className="setting-toggle"><span><strong>Mode tabel ringkas</strong><small>Tampilkan lebih banyak record</small></span><button className={`toggle ${compactTable ? "on" : ""}`} aria-label="Ubah kepadatan tabel" type="button" onClick={() => setCompactTable((value) => !value)}><i /></button></div><div className="setting-toggle"><span><strong>Sidebar ringkas</strong><small>Sembunyikan label menu</small></span><button className={`toggle ${collapsed ? "on" : ""}`} aria-label="Ubah ukuran sidebar" type="button" onClick={() => setCollapsed((value) => !value)}><i /></button></div></article><article className="panel settings-card wide"><div className="settings-title"><span><SlidersHorizontal size={19} /></span><div><h2>Perilaku dashboard</h2><p>Pengaturan pembaruan dan notifikasi</p></div></div><div className="preference-row"><label className="field-label">Interval refresh<select value={refreshSeconds} onChange={(event) => setRefreshSeconds(Number(event.target.value))}><option value={15}>15 detik</option><option value={30}>30 detik</option><option value={60}>1 menit</option><option value={300}>5 menit</option></select></label><div className="setting-toggle"><span><strong>Auto-refresh</strong><small>Pembaruan data otomatis</small></span><button className={`toggle ${autoRefresh ? "on" : ""}`} aria-label="Ubah auto-refresh" type="button" onClick={() => setAutoRefresh((value) => !value)}><i /></button></div></div><button className="primary-action save-action" type="button" onClick={saveSettings}><Save size={14} />Simpan preferensi</button></article></section>}

        <footer><span>MONSTER · Monitoring Sistem Proteksi Terintegrasi</span><span><span className="server-dot" />Terakhir diperbarui {lastSync} WIB</span></footer>
      </main>
      {toast && <div className="toast" role="status"><CheckCircle2 size={16} />{toast}<button type="button" aria-label="Tutup" onClick={() => setToast("")}><X size={13} /></button></div>}
    </div>
  );
}
