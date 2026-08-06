// scripts/patch-map-navigation.mjs
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const projectDirectory = path.resolve(process.argv[2] ?? "");
const appPath = path.join(projectDirectory, "src", "App.tsx");

function fail(message) {
  throw new Error(message);
}

if (!projectDirectory || !fs.existsSync(appPath)) {
  fail(`src/App.tsx tidak ditemukan: ${appPath}`);
}

const content = fs.readFileSync(appPath, "utf8");
const serverItemPattern =
  /\{\s*label:\s*"Server"[\s\S]*?children:\s*\[([\s\S]*?)\]\s*\}/m;
const serverMatch = content.match(serverItemPattern);

if (!serverMatch || serverMatch.index === undefined) {
  fail('Item navigasi "Server" tidak ditemukan pada src/App.tsx.');
}

const serverBlock = serverMatch[0];

if (!serverBlock.includes('label: "Peta Monitoring"')) {
  console.log(
    'Menu "Peta Monitoring" sudah tidak berada di bawah Server.',
  );
  process.exit(0);
}

const updatedServerBlock = serverBlock
  .replace(
    /,\s*\{\s*label:\s*"Peta Monitoring"(?:\s*,\s*badge:\s*"[^"]*")?\s*\}/m,
    "",
  )
  .replace(
    /\{\s*label:\s*"Peta Monitoring"(?:\s*,\s*badge:\s*"[^"]*")?\s*\}\s*,?/m,
    "",
  );

if (updatedServerBlock.includes('label: "Peta Monitoring"')) {
  fail(
    'Menu "Peta Monitoring" ditemukan, tetapi formatnya tidak dikenali.',
  );
}

const updated =
  content.slice(0, serverMatch.index) +
  updatedServerBlock +
  content.slice(serverMatch.index + serverBlock.length);

fs.writeFileSync(appPath, updated, "utf8");

console.log(
  'Menu "Peta Monitoring" berhasil dipindahkan dari navigasi Server.',
);
