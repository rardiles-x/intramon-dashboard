// scripts/generate-gi-coordinates.mjs
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const projectDirectory = path.resolve(process.argv[2] ?? "");
const cachePath = path.resolve(
  process.argv[3] ??
    path.join(
      process.env.USERPROFILE ?? process.cwd(),
      "MONSTER-GitHub-Updater",
      "cache",
      "gi-geocoding.json",
    ),
);
const overridesPath = path.resolve(
  process.argv[4] ??
    path.join(process.cwd(), "gi-coordinate-overrides.json"),
);

const OUTPUT_PATH = path.join(
  projectDirectory,
  "src",
  "features",
  "proteksi",
  "data",
  "giCoordinates.generated.ts",
);
const UNRESOLVED_PATH = path.join(
  projectDirectory,
  "src",
  "features",
  "proteksi",
  "data",
  "giCoordinates.unresolved.json",
);
const CONFIG_PATH = path.join(
  projectDirectory,
  "src",
  "features",
  "proteksi",
  "config.ts",
);

const OVERPASS_ENDPOINT =
  "https://overpass-api.de/api/interpreter";
const NOMINATIM_ENDPOINT =
  "https://nominatim.openstreetmap.org/search";
const REQUEST_DELAY_MS = 1_100;
const VIEWBOX = "110.4,-5.4,116.9,-9.7";

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`File tidak ditemukan: ${filePath}`);
  }

  return fs.readFileSync(filePath, "utf8");
}

function normalizeGiKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\bGARDU\s+INDUK\b/g, " ")
    .replace(/\bGIS\b/g, " ")
    .replace(/\bGI\b/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (
      (character === "\n" || character === "\r") &&
      !quoted
    ) {
      if (
        character === "\r" &&
        source[index + 1] === "\n"
      ) {
        index += 1;
      }

      row.push(cell);

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  row.push(cell);

  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function getCell(row, index) {
  return String(row[index] ?? "").trim();
}

function extractCsvUrl(configText) {
  const match = configText.match(
    /export const CSV_URL\s*=\s*"([^"]+)";/,
  );

  if (!match?.[1]) {
    fail("CSV_URL tidak ditemukan pada config.ts.");
  }

  return match[1];
}

function findDataStart(rows) {
  const searchLimit = Math.min(rows.length, 50);

  for (let index = 0; index < searchLimit; index += 1) {
    const row = rows[index] ?? [];
    const upt = getCell(row, 2).toUpperCase();
    const ultg = getCell(row, 3).toUpperCase();
    const gi = getCell(row, 4).toUpperCase();

    if (
      upt.includes("UPT") &&
      ultg.includes("ULTG") &&
      (gi.includes("GI") || gi.includes("GIS"))
    ) {
      return index + 1;
    }
  }

  return 0;
}

function extractGiRecords(csvText) {
  const rows = parseCsvRows(csvText);
  const start = findDataStart(rows);
  const records = new Map();

  let inheritedUpt = "";
  let inheritedUltg = "";
  let inheritedGi = "";

  for (const row of rows.slice(start)) {
    const directUpt = getCell(row, 2);
    const directUltg = getCell(row, 3);
    const directGi = getCell(row, 4);
    const bay = getCell(row, 5);

    if (directUpt) {
      inheritedUpt = directUpt;
    }

    if (directUltg) {
      inheritedUltg = directUltg;
    }

    if (directGi) {
      inheritedGi = directGi;
    }

    const gi = directGi || inheritedGi;
    const key = normalizeGiKey(gi);

    if (
      !key ||
      key === "NAMA" ||
      key === "NAMA GI" ||
      (!bay && !directGi)
    ) {
      continue;
    }

    const current = records.get(key);

    if (!current) {
      records.set(key, {
        key,
        gi,
        upt: directUpt || inheritedUpt,
        ultg: directUltg || inheritedUltg,
      });
    }
  }

  return [...records.values()].sort(
    (left, right) =>
      left.upt.localeCompare(right.upt, "id", {
        sensitivity: "base",
      }) ||
      left.gi.localeCompare(right.gi, "id", {
        sensitivity: "base",
      }),
  );
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.warn(
      `JSON tidak valid dan diabaikan: ${filePath}`,
      error instanceof Error ? error.message : error,
    );

    return fallback;
  }
}

function provinceFor(record) {
  return record.upt.toUpperCase().includes("BALI")
    ? "Bali"
    : "Jawa Timur";
}

function tokenizeLocationName(value) {
  return normalizeGiKey(value)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function locationNameScore(record, candidateName) {
  const expected = normalizeGiKey(record.gi);
  const candidate = normalizeGiKey(candidateName);

  if (!expected || !candidate) {
    return 0;
  }

  if (expected === candidate) {
    return 1_000;
  }

  if (
    expected.includes(candidate) ||
    candidate.includes(expected)
  ) {
    return 760;
  }

  const expectedTokens = new Set(
    tokenizeLocationName(expected),
  );
  const candidateTokens = new Set(
    tokenizeLocationName(candidate),
  );
  const intersection = [...expectedTokens].filter((token) =>
    candidateTokens.has(token),
  ).length;
  const union = new Set([
    ...expectedTokens,
    ...candidateTokens,
  ]).size;

  return union > 0
    ? Math.round((intersection / union) * 600)
    : 0;
}

async function loadOverpassSubstations() {
  const query = `
[out:json][timeout:120];
(
  nwr["power"="substation"]["name"](-9.8,110.2,-5.0,116.9);
);
out center tags;
`;

  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent":
          "MONSTER-Protection-Dashboard/1.0 " +
          "(https://github.com/rardiles-x/intramon-dashboard)",
      },
      body: new URLSearchParams({ data: query }),
    });

    if (!response.ok) {
      throw new Error(
        `Overpass merespons HTTP ${response.status}.`,
      );
    }

    const payload = await response.json();
    const elements = Array.isArray(payload.elements)
      ? payload.elements
      : [];

    return elements
      .map((element) => {
        const latitude = Number(
          element.lat ?? element.center?.lat,
        );
        const longitude = Number(
          element.lon ?? element.center?.lon,
        );
        const tags = element.tags ?? {};
        const name = String(
          tags.name ??
            tags["name:id"] ??
            tags.ref ??
            "",
        ).trim();

        if (
          !name ||
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return null;
        }

        return {
          name,
          latitude,
          longitude,
          displayName: [
            name,
            tags.operator,
            tags.substation,
          ].filter(Boolean).join(" · "),
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn(
      "Daftar substation Overpass tidak dapat dimuat. " +
        "Installer akan memakai geocoding fallback.",
      error instanceof Error ? error.message : error,
    );

    return [];
  }
}

function findOverpassCoordinate(record, substations) {
  let best = null;

  for (const substation of substations) {
    const score = locationNameScore(
      record,
      substation.name,
    );

    if (!best || score > best.score) {
      best = {
        ...substation,
        score,
      };
    }
  }

  if (!best || best.score < 400) {
    return null;
  }

  return {
    latitude: best.latitude,
    longitude: best.longitude,
    precision: "exact",
    displayName: best.displayName,
    query: "OpenStreetMap power=substation",
  };
}

function buildQueries(record) {
  const coreName = normalizeGiKey(record.gi);
  const province = provinceFor(record);
  const context = [
    record.ultg,
    record.upt,
    province,
    "Indonesia",
  ].filter(Boolean).join(", ");

  return [
    `Gardu Induk ${coreName}, ${context}`,
    `Substation ${coreName}, ${context}`,
    `${coreName}, ${context}`,
  ];
}

function normalizedTokens(value) {
  return normalizeGiKey(value)
    .split(" ")
    .filter((token) => token.length >= 3);
}

function scoreResult(record, result) {
  const display = normalizeGiKey(result.display_name ?? "");
  const tokens = normalizedTokens(record.gi);
  const category = String(
    result.category ?? result.class ?? "",
  ).toLowerCase();
  const type = String(result.type ?? "").toLowerCase();

  let score = Number(result.importance ?? 0) * 10;

  if (category === "power") {
    score += 120;
  }

  if (
    type.includes("substation") ||
    display.includes("GARDU INDUK")
  ) {
    score += 100;
  }

  const matchedTokens = tokens.filter((token) =>
    display.includes(token),
  ).length;

  score += matchedTokens * 24;

  if (
    record.ultg &&
    display.includes(normalizeGiKey(record.ultg))
  ) {
    score += 12;
  }

  if (
    display.includes(
      normalizeGiKey(provinceFor(record)),
    )
  ) {
    score += 8;
  }

  return score;
}

function classifyPrecision(result) {
  const category = String(
    result.category ?? result.class ?? "",
  ).toLowerCase();
  const type = String(result.type ?? "").toLowerCase();
  const display = String(result.display_name ?? "").toLowerCase();

  return (
    category === "power" ||
    type.includes("substation") ||
    display.includes("gardu induk")
  )
    ? "exact"
    : "approximate";
}

function sleep(milliseconds) {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds),
  );
}

let lastRequestAt = 0;

async function searchNominatim(query) {
  const elapsed = Date.now() - lastRequestAt;

  if (elapsed < REQUEST_DELAY_MS) {
    await sleep(REQUEST_DELAY_MS - elapsed);
  }

  const url = new URL(NOMINATIM_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "id");
  url.searchParams.set("viewbox", VIEWBOX);
  url.searchParams.set("bounded", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("namedetails", "1");
  url.searchParams.set("accept-language", "id");

  lastRequestAt = Date.now();

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "MONSTER-Protection-Dashboard/1.0 " +
        "(https://github.com/rardiles-x/intramon-dashboard)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Nominatim merespons HTTP ${response.status}.`,
    );
  }

  const result = await response.json();

  return Array.isArray(result) ? result : [];
}

async function geocodeRecord(record) {
  const queries = buildQueries(record);
  let best = null;

  for (const query of queries) {
    const results = await searchNominatim(query);

    for (const result of results) {
      const latitude = Number(result.lat);
      const longitude = Number(result.lon);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        continue;
      }

      const candidate = {
        latitude,
        longitude,
        precision: classifyPrecision(result),
        displayName:
          String(result.display_name ?? query),
        query,
        score: scoreResult(record, result),
      };

      if (!best || candidate.score > best.score) {
        best = candidate;
      }
    }

    if (best && best.precision === "exact") {
      break;
    }
  }

  if (!best) {
    return null;
  }

  return {
    latitude: best.latitude,
    longitude: best.longitude,
    precision: best.precision,
    displayName: best.displayName,
    query: best.query,
  };
}

function normalizeOverrideEntries(overrides) {
  const result = {};

  for (const [rawKey, value] of Object.entries(overrides)) {
    const key = normalizeGiKey(rawKey);

    if (!key || typeof value !== "object" || value === null) {
      continue;
    }

    const latitude = Number(value.latitude);
    const longitude = Number(value.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      console.warn(
        `Override dilewati karena koordinat tidak valid: ${rawKey}`,
      );
      continue;
    }

    result[key] = {
      latitude,
      longitude,
      precision: "manual",
      displayName:
        String(value.displayName ?? rawKey),
      query: "manual override",
    };
  }

  return result;
}

function serializeCoordinates(coordinates) {
  const ordered = Object.fromEntries(
    Object.entries(coordinates).sort(([left], [right]) =>
      left.localeCompare(right, "id", {
        sensitivity: "base",
      }),
    ),
  );

  return `/**
 * Generated by scripts/generate-gi-coordinates.mjs.
 *
 * Do not edit this file directly. Use gi-coordinate-overrides.json for
 * verified manual corrections.
 */
import type { GiCoordinate } from "../types";

export const GI_COORDINATES_GENERATED_AT =
  ${JSON.stringify(new Date().toISOString())};

export const GI_COORDINATES: Record<string, GiCoordinate> =
  ${JSON.stringify(ordered, null, 2)};
`;
}

async function main() {
  if (!projectDirectory) {
    fail(
      "Path project wajib diberikan sebagai argumen pertama.",
    );
  }

  const csvUrl = extractCsvUrl(readText(CONFIG_PATH));

  console.log("Mengambil daftar GI dari Google Sheets...");
  const csvResponse = await fetch(csvUrl, {
    headers: {
      Accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
    },
  });

  if (!csvResponse.ok) {
    fail(
      `Google Sheets merespons HTTP ${csvResponse.status}.`,
    );
  }

  const giRecords = extractGiRecords(await csvResponse.text());

  if (giRecords.length === 0) {
    fail("Daftar Gardu Induk tidak ditemukan pada CSV.");
  }

  const overrides = normalizeOverrideEntries(
    readJson(overridesPath, {}),
  );
  const cache = readJson(cachePath, {});
  const substations = await loadOverpassSubstations();

  console.log(
    `${substations.length} objek power=substation tersedia untuk pencocokan.`,
  );
  const coordinates = {};
  const unresolved = [];

  fs.mkdirSync(path.dirname(cachePath), {
    recursive: true,
  });

  console.log(
    `${giRecords.length} GI ditemukan. ` +
      "Geocoding berjalan satu per satu dan hasilnya dicache.",
  );

  for (
    let index = 0;
    index < giRecords.length;
    index += 1
  ) {
    const record = giRecords[index];
    const prefix =
      `[${index + 1}/${giRecords.length}] ${record.gi}`;

    if (overrides[record.key]) {
      coordinates[record.key] = overrides[record.key];
      console.log(`${prefix} → manual`);
      continue;
    }

    if (cache[record.key]) {
      coordinates[record.key] = cache[record.key];
      console.log(
        `${prefix} → cache (${cache[record.key].precision})`,
      );
      continue;
    }

    const overpassCoordinate =
      findOverpassCoordinate(record, substations);

    if (overpassCoordinate) {
      coordinates[record.key] = overpassCoordinate;
      cache[record.key] = overpassCoordinate;

      fs.writeFileSync(
        cachePath,
        `${JSON.stringify(cache, null, 2)}\n`,
        "utf8",
      );

      console.log(`${prefix} → exact (OpenStreetMap substation)`);
      continue;
    }

    try {
      const coordinate = await geocodeRecord(record);

      if (!coordinate) {
        unresolved.push(record);
        console.warn(`${prefix} → tidak ditemukan`);
        continue;
      }

      coordinates[record.key] = coordinate;
      cache[record.key] = coordinate;

      fs.writeFileSync(
        cachePath,
        `${JSON.stringify(cache, null, 2)}\n`,
        "utf8",
      );

      console.log(
        `${prefix} → ${coordinate.precision} ` +
          `(${coordinate.latitude}, ${coordinate.longitude})`,
      );
    } catch (error) {
      unresolved.push(record);
      console.warn(
        `${prefix} → gagal: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), {
    recursive: true,
  });
  fs.writeFileSync(
    OUTPUT_PATH,
    serializeCoordinates(coordinates),
    "utf8",
  );
  fs.writeFileSync(
    UNRESOLVED_PATH,
    `${JSON.stringify(unresolved, null, 2)}\n`,
    "utf8",
  );

  console.log("");
  console.log(
    `Koordinat tersimpan: ${
      Object.keys(coordinates).length
    }/${giRecords.length}`,
  );
  console.log(`Generated: ${OUTPUT_PATH}`);
  console.log(`Belum ditemukan: ${UNRESOLVED_PATH}`);

  if (Object.keys(coordinates).length === 0) {
    fail(
      "Tidak ada koordinat yang berhasil dibuat. " +
        "Periksa jaringan atau isi gi-coordinate-overrides.json.",
    );
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
