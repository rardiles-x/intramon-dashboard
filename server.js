import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import chokidar from "chokidar";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import multer from "multer";
import * as XLSX from "xlsx";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(currentDir, "..");
const resolveFromServer = (value) => path.resolve(serverRoot, value);
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "0.0.0.0";
const databasePath = resolveFromServer(process.env.DATABASE_PATH || "./data/intramon.db");
const spreadsheetPath = resolveFromServer(process.env.SPREADSHEET_PATH || "./data/monitoring.xlsx");
const allowedOrigins = (process.env.CORS_ORIGIN || "*").split(",").map((value) => value.trim()).filter(Boolean);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS monitoring (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    source TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Normal', 'Warning', 'Critical')),
    server TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS servers (
    name TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    ip TEXT NOT NULL,
    status TEXT NOT NULL,
    cpu INTEGER NOT NULL DEFAULT 0,
    ram INTEGER NOT NULL DEFAULT 0,
    storage INTEGER NOT NULL DEFAULT 0,
    uptime REAL NOT NULL DEFAULT 0,
    response_ms INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    imported INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const seedMonitoring = [
  ["MON-1248", "05 Agu 2026 · 08:42", "2026-08-05T01:42:00.000Z", "Data Operasional.xlsx", "Sinkronisasi selesai", "Normal", "SRV-INTRA-01"],
  ["MON-1247", "05 Agu 2026 · 08:28", "2026-08-05T01:28:00.000Z", "Penjualan Harian.xlsx", "Data penjualan berhasil diperbarui", "Normal", "SRV-INTRA-02"],
  ["MON-1246", "05 Agu 2026 · 08:15", "2026-08-05T01:15:00.000Z", "Inventori Gudang.xlsx", "12 baris memerlukan validasi", "Warning", "SRV-INTRA-01"],
  ["MON-1245", "05 Agu 2026 · 07:57", "2026-08-05T00:57:00.000Z", "Laporan Keuangan.xlsx", "Respons sumber melebihi 10 detik", "Critical", "SRV-INTRA-03"],
];
const seedServers = [
  ["SRV-INTRA-01", "Primary Data Server", "10.10.20.11", "Online", 42, 61, 73, 99.98, 18],
  ["SRV-INTRA-02", "Spreadsheet Worker", "10.10.20.12", "Online", 28, 49, 58, 99.97, 23],
  ["SRV-INTRA-03", "Backup & Archive", "10.10.20.13", "Online", 16, 37, 81, 99.96, 31],
];

if (db.prepare("SELECT COUNT(*) AS total FROM monitoring").get().total === 0) {
  const insert = db.prepare("INSERT INTO monitoring (id, time, occurred_at, source, description, status, server) VALUES (?, ?, ?, ?, ?, ?, ?)");
  db.transaction((rows) => rows.forEach((row) => insert.run(...row)))(seedMonitoring);
}
if (db.prepare("SELECT COUNT(*) AS total FROM servers").get().total === 0) {
  const insert = db.prepare("INSERT INTO servers (name, role, ip, status, cpu, ram, storage, uptime, response_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  db.transaction((rows) => rows.forEach((row) => insert.run(...row)))(seedServers);
}
for (const [key, value] of [["refreshSeconds", "30"], ["autoRefresh", "true"]]) {
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

const normaliseStatus = (value) => {
  const status = String(value || "Normal").toLowerCase();
  if (status.includes("critical") || status.includes("kritis")) return "Critical";
  if (status.includes("warning") || status.includes("peringatan")) return "Warning";
  return "Normal";
};

const firstValue = (row, names, fallback = "") => {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && String(row[name]).trim() !== "") return row[name];
  }
  return fallback;
};

const toMonitoringRecord = (row, index, sourceName) => {
  const occurredAtRaw = firstValue(row, ["occurredAt", "Occurred At", "Tanggal", "Waktu", "time"], new Date().toISOString());
  const parsedDate = new Date(occurredAtRaw);
  const occurredAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
  return {
    id: String(firstValue(row, ["ID", "Id", "id", "ID Monitoring"], `IMP-${Date.now()}-${index + 1}`)),
    time: String(firstValue(row, ["Waktu", "time", "Time"], new Date(occurredAt).toLocaleString("id-ID"))),
    occurredAt,
    source: String(firstValue(row, ["Sumber", "source", "Source", "Sumber Data"], sourceName)),
    description: String(firstValue(row, ["Deskripsi", "description", "Description", "Keterangan"], "Data berhasil diimpor")),
    status: normaliseStatus(firstValue(row, ["Status", "status"], "Normal")),
    server: String(firstValue(row, ["Server", "server", "Nama Server"], "UPLOAD-INTRANET")),
  };
};

const upsertMonitoring = db.prepare(`
  INSERT INTO monitoring (id, time, occurred_at, source, description, status, server, updated_at)
  VALUES (@id, @time, @occurredAt, @source, @description, @status, @server, CURRENT_TIMESTAMP)
  ON CONFLICT(id) DO UPDATE SET
    time = excluded.time,
    occurred_at = excluded.occurred_at,
    source = excluded.source,
    description = excluded.description,
    status = excluded.status,
    server = excluded.server,
    updated_at = CURRENT_TIMESTAMP
`);
const saveMonitoringRecords = db.transaction((records) => records.forEach((record) => upsertMonitoring.run(record)));

const workbookRecords = (workbook, sourceName) => {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: false });
  return rows.map((row, index) => toMonitoringRecord(row, index, sourceName));
};

const importSpreadsheetFile = (filePath) => {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const records = workbookRecords(workbook, path.basename(filePath));
  saveMonitoringRecords(records);
  db.prepare("INSERT INTO sync_log (source, imported, status, message) VALUES (?, ?, 'success', ?)")
    .run(path.basename(filePath), records.length, "Spreadsheet imported");
  return records.length;
};

const app = express();
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(express.json({ limit: "10mb" }));

app.get("/", (_request, response) => response.json({
  name: "Intramon API",
  version: "1.0.0",
  health: "/api/health",
}));

app.get("/api/health", (_request, response) => {
  const database = db.prepare("SELECT 1 AS ok").get();
  response.json({ status: "ok", database: database.ok === 1, timestamp: new Date().toISOString() });
});

app.get("/api/monitoring", (request, response) => {
  const limit = Math.min(Math.max(Number(request.query.limit) || 500, 1), 5000);
  const records = db.prepare(`
    SELECT id, time, occurred_at AS occurredAt, source, description, status, server
    FROM monitoring ORDER BY occurred_at DESC, updated_at DESC LIMIT ?
  `).all(limit);
  response.json({ records });
});

app.post("/api/monitoring", (request, response) => {
  const input = Array.isArray(request.body?.records) ? request.body.records : [];
  if (!input.length) return response.status(400).json({ error: "records must be a non-empty array" });
  const records = input.map((row, index) => toMonitoringRecord(row, index, "API"));
  saveMonitoringRecords(records);
  db.prepare("INSERT INTO sync_log (source, imported, status, message) VALUES ('API', ?, 'success', 'Records received')").run(records.length);
  return response.status(201).json({ imported: records.length });
});

app.get("/api/servers", (_request, response) => {
  const servers = db.prepare(`
    SELECT name, role, ip, status, cpu, ram, storage, uptime, response_ms AS responseMs
    FROM servers ORDER BY name
  `).all();
  response.json({ servers });
});

app.post("/api/servers", (request, response) => {
  const input = Array.isArray(request.body?.servers) ? request.body.servers : [];
  if (!input.length) return response.status(400).json({ error: "servers must be a non-empty array" });
  const statement = db.prepare(`
    INSERT INTO servers (name, role, ip, status, cpu, ram, storage, uptime, response_ms, updated_at)
    VALUES (@name, @role, @ip, @status, @cpu, @ram, @storage, @uptime, @responseMs, CURRENT_TIMESTAMP)
    ON CONFLICT(name) DO UPDATE SET role=excluded.role, ip=excluded.ip, status=excluded.status,
      cpu=excluded.cpu, ram=excluded.ram, storage=excluded.storage, uptime=excluded.uptime,
      response_ms=excluded.response_ms, updated_at=CURRENT_TIMESTAMP
  `);
  db.transaction((servers) => servers.forEach((server) => statement.run({
    name: String(server.name), role: String(server.role || "Server"), ip: String(server.ip || "-"),
    status: String(server.status || "Offline"), cpu: Number(server.cpu) || 0, ram: Number(server.ram) || 0,
    storage: Number(server.storage) || 0, uptime: Number(server.uptime) || 0, responseMs: Number(server.responseMs) || 0,
  })))(input);
  return response.status(201).json({ updated: input.length });
});

app.get("/api/settings", (_request, response) => {
  const values = Object.fromEntries(db.prepare("SELECT key, value FROM settings").all().map((row) => [row.key, row.value]));
  response.json({ settings: {
    sourceApiUrl: "",
    refreshSeconds: Number(values.refreshSeconds || 30),
    autoRefresh: values.autoRefresh !== "false",
  } });
});

app.put("/api/settings", (request, response) => {
  const refreshSeconds = Math.min(Math.max(Number(request.body?.refreshSeconds) || 30, 5), 3600);
  const autoRefresh = request.body?.autoRefresh !== false;
  const statement = db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
  `);
  db.transaction(() => {
    statement.run("refreshSeconds", String(refreshSeconds));
    statement.run("autoRefresh", String(autoRefresh));
  })();
  response.json({ settings: { sourceApiUrl: "", refreshSeconds, autoRefresh } });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_request, file, callback) {
    callback(null, /\.(xlsx|xls|csv)$/i.test(file.originalname));
  },
});

app.post("/api/upload", upload.single("file"), (request, response) => {
  if (!request.file) return response.status(400).json({ error: "Attach one .xlsx, .xls, or .csv file in field 'file'" });
  const workbook = XLSX.read(request.file.buffer, { type: "buffer", cellDates: true });
  const records = workbookRecords(workbook, request.file.originalname);
  saveMonitoringRecords(records);
  db.prepare("INSERT INTO sync_log (source, imported, status, message) VALUES (?, ?, 'success', 'Uploaded spreadsheet imported')")
    .run(request.file.originalname, records.length);
  return response.status(201).json({ imported: records.length });
});

app.post("/api/sync", (_request, response) => {
  if (!fs.existsSync(spreadsheetPath)) return response.json({ imported: 0, message: `No spreadsheet found at ${spreadsheetPath}` });
  const imported = importSpreadsheetFile(spreadsheetPath);
  return response.json({ imported, source: path.basename(spreadsheetPath) });
});

app.get("/api/sync-log", (request, response) => {
  const limit = Math.min(Math.max(Number(request.query.limit) || 50, 1), 500);
  response.json({ logs: db.prepare("SELECT * FROM sync_log ORDER BY id DESC LIMIT ?").all(limit) });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: error.message || "Internal server error" });
});

app.listen(port, host, () => {
  console.log(`Intramon API listening on http://${host}:${port}`);
  console.log(`Database: ${databasePath}`);
  if (fs.existsSync(spreadsheetPath)) console.log(`Watching spreadsheet: ${spreadsheetPath}`);
});

let watcherTimer;
chokidar.watch(spreadsheetPath, { ignoreInitial: false, awaitWriteFinish: { stabilityThreshold: 700, pollInterval: 100 } })
  .on("add", () => {
    clearTimeout(watcherTimer);
    watcherTimer = setTimeout(() => {
      try { console.log(`Imported ${importSpreadsheetFile(spreadsheetPath)} spreadsheet records`); }
      catch (error) { console.error("Spreadsheet import failed", error); }
    }, 250);
  })
  .on("change", () => {
    clearTimeout(watcherTimer);
    watcherTimer = setTimeout(() => {
      try { console.log(`Imported ${importSpreadsheetFile(spreadsheetPath)} spreadsheet records`); }
      catch (error) { console.error("Spreadsheet import failed", error); }
    }, 800);
  });

const shutdown = () => {
  db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
