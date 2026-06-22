// Doctor: pre-install environment / bundle health check.
// install.sh and install.bat point users here when something fails. doctor does
// not read install-state — it diagnoses whether this machine and this unzipped
// bundle can run an install at all: Node version, required bundle members, and
// whether the chosen install target directory is writable.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const MIN_NODE_MAJOR = 18;

// Members the CLI needs at runtime. schemas/ backs install-state validation;
// scripts/ is reached at import time (planner -> pack-composer -> pack-validator);
// package.json must declare "type":"module" for `node src/cli.js` to run.
const REQUIRED_FILES = [
  'package.json',
  'src/cli.js',
  'manifests/modules.json',
  'manifests/profiles.json',
  'schemas/install-state.schema.json',
  'scripts/check-asset-schema.js',
  'scripts/check-catalog-parity.js',
];
const REQUIRED_DIRS = ['assets'];

const BUNDLE_HINT = 'bundle 압축을 다시 풀거나, zip을 푼 폴더 안에서 실행하세요.';

function checkNode() {
  const version = process.versions.node;
  const major = Number(version.split('.')[0]);
  const ok = Number.isFinite(major) && major >= MIN_NODE_MAJOR;
  return {
    name: 'node',
    status: ok ? 'ok' : 'fail',
    detail: `v${version} (>= ${MIN_NODE_MAJOR} required)`,
    ...(ok ? {} : { hint: 'Node.js LTS(>=18)를 https://nodejs.org 에서 설치 후 다시 실행하세요.' }),
  };
}

function checkBundleFile(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    return { name: 'bundle', status: 'fail', detail: `${rel} (없음)`, hint: BUNDLE_HINT };
  }
  if (rel === 'package.json') {
    try {
      const pkg = JSON.parse(fs.readFileSync(abs, 'utf8'));
      if (pkg.type !== 'module') {
        return { name: 'bundle', status: 'fail', detail: `${rel} (type must be "module", got ${pkg.type ?? 'undefined'})`, hint: BUNDLE_HINT };
      }
      return { name: 'bundle', status: 'ok', detail: `${rel} (type: module)` };
    } catch (error) {
      return { name: 'bundle', status: 'fail', detail: `${rel} (parse error: ${error.message})`, hint: BUNDLE_HINT };
    }
  }
  return { name: 'bundle', status: 'ok', detail: rel };
}

function checkBundle() {
  const checks = REQUIRED_FILES.map(checkBundleFile);
  for (const rel of REQUIRED_DIRS) {
    const abs = path.join(ROOT, rel);
    const ok = fs.existsSync(abs) && fs.statSync(abs).isDirectory();
    checks.push({ name: 'bundle', status: ok ? 'ok' : 'fail', detail: `${rel}/`, ...(ok ? {} : { hint: BUNDLE_HINT }) });
  }
  return checks;
}

function checkTargetWritable(request) {
  const scope = request.scope || 'project';
  const target = scope === 'home' ? (request.homeDir || os.homedir()) : request.projectRoot;
  if (!target) return null;
  const name = scope === 'home' ? 'home' : 'project';

  if (!fs.existsSync(target)) {
    return { name, status: 'fail', detail: `${target} (경로 없음)`, hint: '설치 대상 경로가 존재하는지 확인하세요.' };
  }
  try {
    fs.accessSync(target, fs.constants.W_OK);
    return { name, status: 'ok', detail: `${target} (writable)` };
  } catch {
    return {
      name,
      status: 'fail',
      detail: `${target} (쓰기 권한 없음)`,
      hint: '대상 폴더의 쓰기 권한을 확인하거나, 회사 관리 PC면 IT/관리 담당자에게 문의하세요.',
    };
  }
}

export function runDoctor(request = {}) {
  const checks = [checkNode(), ...checkBundle()];
  const writable = checkTargetWritable(request);
  if (writable) checks.push(writable);
  return { ok: checks.every((check) => check.status === 'ok'), checks };
}
