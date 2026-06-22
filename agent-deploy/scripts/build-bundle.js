#!/usr/bin/env node
// Bundle build: package the agent-deploy bundle into a reproducible OS-common zip
// plus a SHA-256 checksum. Pure Node, zero-dependency, deterministic — entry
// order is sorted and timestamps are fixed, so identical contents always produce
// an identical archive and checksum.
//
//   node scripts/build-bundle.js              -> dist/company-agent-kit-<version>.zip
//   node scripts/build-bundle.js --out DIR    -> write artifacts into DIR instead
//
// Outputs (versioned canonical + stable alias, identical bytes, each with a
// .sha256 sidecar in sha256sum format):
//   company-agent-kit-<version>.zip      company-agent-kit-<version>.zip.sha256
//   company-agent-kit.zip                company-agent-kit.zip.sha256
//
// Internal layout: everything under a stable top-level `company-agent-kit/`
// folder, mirroring the runtime layout that install.sh / install.bat / the
// package.json bin already expect. schemas/ (runtime install-state validation),
// scripts/ (planner -> pack-composer -> pack-validator reaches check-asset-schema
// + check-catalog-parity at import time), and package.json ("type":"module" is
// required for `node src/cli.js`) are all mandatory members.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const TOP = 'company-agent-kit';

const BUNDLE_DIRS = ['src', 'scripts', 'manifests', 'schemas', 'docs', 'assets'];
const BUNDLE_FILES = ['package.json', 'README.md', 'SETUP_WIZARD.md', 'install.sh', 'install.bat'];

// Fixed DOS timestamp (1980-01-01 00:00:00) so archives are byte-reproducible.
const DOS_TIME = 0;
const DOS_DATE = 0x21;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc = (CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function collectEntries() {
  const entries = [];
  const pushFile = (absPath, archivePath) => {
    entries.push({ archivePath, absPath, mode: fs.statSync(absPath).mode });
  };
  const walk = (absDir, archiveDir) => {
    for (const name of fs.readdirSync(absDir).sort()) {
      const abs = path.join(absDir, name);
      const arch = `${archiveDir}/${name}`;
      const stat = fs.statSync(abs);
      if (stat.isDirectory()) walk(abs, arch);
      else if (stat.isFile()) pushFile(abs, arch);
    }
  };

  for (const file of BUNDLE_FILES) {
    const abs = path.join(ROOT, file);
    if (!fs.existsSync(abs)) throw new Error(`bundle file missing: ${file}`);
    pushFile(abs, `${TOP}/${file}`);
  }
  for (const dir of BUNDLE_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) throw new Error(`bundle dir missing: ${dir}`);
    walk(abs, `${TOP}/${dir}`);
  }

  entries.sort((a, b) => (a.archivePath < b.archivePath ? -1 : a.archivePath > b.archivePath ? 1 : 0));
  return entries;
}

function buildZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const data = fs.readFileSync(entry.absPath);
    const crc = crc32(data);
    const deflated = zlib.deflateRawSync(data, { level: 9 });

    // Store (method 0) when deflate would not shrink the file (e.g. empty files).
    let method = 8;
    let payload = deflated;
    if (deflated.length >= data.length) {
      method = 0;
      payload = data;
    }

    const nameBuf = Buffer.from(entry.archivePath, 'utf8');

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28); // extra length
    localParts.push(local, nameBuf, payload);

    const externalAttr = ((entry.mode & 0o777) << 16) >>> 0;
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4); // version made by: unix host, spec 2.0
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(payload.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra length
    central.writeUInt16LE(0, 32); // comment length
    central.writeUInt16LE(0, 34); // disk number start
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(externalAttr, 38); // external attrs (unix mode)
    central.writeUInt32LE(offset, 42); // local header offset
    centralParts.push(central, nameBuf);

    offset += local.length + nameBuf.length + payload.length;
  }

  const localBuf = Buffer.concat(localParts);
  const centralBuf = Buffer.concat(centralParts);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // central dir start disk
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(localBuf.length, 16); // central dir offset
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([localBuf, centralBuf, eocd]);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--out') {
      args.out = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function buildBundle({ out } = {}) {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const version = pkg.version;
  const distDir = out ? path.resolve(out) : path.join(ROOT, 'dist');

  const entries = collectEntries();
  const zipBuf = buildZip(entries);
  const digest = crypto.createHash('sha256').update(zipBuf).digest('hex');

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  const versioned = `${TOP}-${version}.zip`;
  const alias = `${TOP}.zip`;
  for (const name of [versioned, alias]) {
    const zipPath = path.join(distDir, name);
    fs.writeFileSync(zipPath, zipBuf);
    fs.writeFileSync(`${zipPath}.sha256`, `${digest}  ${name}\n`);
  }

  return {
    version, distDir, versioned, alias, digest, entryCount: entries.length, size: zipBuf.length,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = buildBundle({ out: args.out });
  console.log(`agent-deploy bundle built (v${result.version})`);
  console.log(`  entries: ${result.entryCount}`);
  console.log(`  size:    ${result.size} bytes`);
  console.log(`  sha256:  ${result.digest}`);
  console.log(`  output:  ${path.relative(ROOT, result.distDir)}/${result.versioned}`);
  console.log(`           ${path.relative(ROOT, result.distDir)}/${result.alias} (alias, identical bytes)`);
  console.log('           + .sha256 sidecar for each (sha256sum -c compatible)');
}

main();
