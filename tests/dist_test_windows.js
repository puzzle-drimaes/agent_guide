const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const scriptDir = __dirname;
const repoRoot = path.resolve(scriptDir, '..');
const deployDir = process.env.AGENT_DEPLOY_DIR || path.join(repoRoot, 'agent-deploy');
const target = process.env.TARGET || 'codex';
const profile = process.env.PROFILE || 'developer';
const scope = process.env.SCOPE || 'project';
const keepProject = !/^(0|false|no)$/i.test(process.env.DIST_TEST_KEEP_PROJECT || '1');
const runNpmTest = /^(1|true|yes)$/i.test(process.env.DIST_TEST_RUN_NPM_TEST || '0');
const timestamp = new Date().toISOString().replace(/[-:T]/g, '').replace(/\..+/, '');
const resultDir = process.env.DIST_TEST_RESULT_DIR || path.join(scriptDir, 'results');
const project = process.env.PROJECT || path.join(os.tmpdir(), `agent-bundle-dist-test-${timestamp}`);
const logFile = path.join(resultDir, `dist-test-windows-${timestamp}.log`);
const cliJs = path.join(deployDir, 'src', 'cli.js');

fs.mkdirSync(resultDir, { recursive: true });
fs.mkdirSync(project, { recursive: true });
fs.writeFileSync(logFile, '');

function log(message = '') {
  console.log(message);
  fs.appendFileSync(logFile, `${message}${os.EOL}`);
}

function resolveCommand(candidates) {
  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) return candidate;
    const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', [candidate], {
      encoding: 'utf8',
      shell: false,
    });
    if (probe.status === 0) {
      const first = probe.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
      if (first) return first;
    }
  }
  return null;
}

function run(label, command, args, options = {}) {
  log('');
  log(`==> ${label}`);
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    shell: false,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  if (result.stdout) fs.appendFileSync(logFile, result.stdout);
  if (result.stderr) fs.appendFileSync(logFile, result.stderr);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status}`);
}

function assertExists(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`expected path not found: ${filePath}`);
}

function assertAbsent(filePath) {
  if (filePath && fs.existsSync(filePath)) throw new Error(`path should not exist after dry-run: ${filePath}`);
}

function targetPaths() {
  if (target === 'codex') {
    return {
      entry: path.join(project, 'AGENTS.md'),
      state: path.join(project, '.agent-deploy', 'install-state.json'),
      feedbackSkill: path.join(project, '.agents', 'skills', 'agent-bundle-feedback', 'SKILL.md'),
      config: path.join(project, '.codex', 'config.toml'),
    };
  }
  if (target === 'gemini') {
    return {
      entry: path.join(project, 'GEMINI.md'),
      state: path.join(project, '.agent-deploy', 'install-state.json'),
      feedbackSkill: path.join(project, '.gemini', 'skills', 'agent-bundle-feedback', 'SKILL.md'),
      config: null,
    };
  }
  if (target === 'claude') {
    return {
      entry: null,
      state: path.join(project, '.claude', 'agent-install-state.json'),
      feedbackSkill: path.join(project, '.claude', 'skills', 'agent-bundle-feedback', 'SKILL.md'),
      config: path.join(project, '.mcp.json'),
    };
  }
  if (target === 'cursor') {
    return {
      entry: null,
      state: path.join(project, '.cursor', 'agent-install-state.json'),
      feedbackSkill: path.join(project, '.cursor', 'skills', 'agent-bundle-feedback', 'SKILL.md'),
      config: path.join(project, '.cursor', 'mcp.json'),
    };
  }
  throw new Error(`unsupported TARGET: ${target}`);
}

function listFiles(root, limit = 80) {
  const out = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (out.length >= limit) return;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(full);
    }
  }
  walk(root);
  return out;
}

let exitCode = 0;
try {
  const nodeCommand = resolveCommand([
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'node.exe'),
    'node.exe',
    'node',
  ]);
  const npmCommand = process.env.NPM_BIN || resolveCommand([
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'npm.cmd'),
    'npm.cmd',
    'npm',
  ]);

  if (!nodeCommand) throw new Error('node is required (>= 18)');
  if (!npmCommand) throw new Error('npm is required. Set NPM_BIN=npm.cmd if needed.');
  if (!fs.existsSync(cliJs)) throw new Error(`agent-deploy CLI not found: ${cliJs}`);

  log('Agent bundle distribution test');
  log(`repo: ${repoRoot}`);
  log(`agent-deploy: ${deployDir}`);
  log(`target/profile/scope: ${target} / ${profile} / ${scope}`);
  log(`project: ${project}`);
  log(`log: ${logFile}`);
  log(`node command: ${nodeCommand}`);
  log(`npm command: ${npmCommand}`);

  run('node --version', nodeCommand, ['--version']);
  run('npm --version', npmCommand, ['--version']);
  run('node version check', nodeCommand, ['-e', "const major=Number(process.versions.node.split('.')[0]); if (major < 18) process.exit(1); console.log('Node version OK: ' + process.version);"]);

  const paths = targetPaths();

  run('npm run validate', npmCommand, ['run', 'validate'], { cwd: deployDir });
  if (runNpmTest && fs.existsSync(path.join(deployDir, 'test'))) {
    run('npm test', npmCommand, ['test'], { cwd: deployDir });
  } else {
    log(`npm test skipped: DIST_TEST_RUN_NPM_TEST=${process.env.DIST_TEST_RUN_NPM_TEST || '0'}`);
  }

  run('doctor before apply', nodeCommand, [cliJs, 'doctor', '--project', project]);
  run('apply dry-run', nodeCommand, [cliJs, 'apply', '--target', target, '--profile', profile, '--scope', scope, '--project', project, '--dry-run']);
  assertAbsent(paths.entry);
  assertAbsent(paths.state);

  run('apply backup', nodeCommand, [cliJs, 'apply', '--target', target, '--profile', profile, '--scope', scope, '--project', project, '--backup']);
  if (paths.entry) assertExists(paths.entry);
  assertExists(paths.state);
  assertExists(paths.feedbackSkill);
  if (paths.config) assertExists(paths.config);

  run('doctor after apply', nodeCommand, [cliJs, 'doctor', '--project', project]);
  run('update dry-run', nodeCommand, [cliJs, 'update', '--target', target, '--profile', profile, '--scope', scope, '--project', project, '--dry-run']);
  run('repair dry-run', nodeCommand, [cliJs, 'repair', '--target', target, '--profile', profile, '--scope', scope, '--project', project, '--dry-run']);
  run('uninstall dry-run', nodeCommand, [cliJs, 'uninstall', '--target', target, '--profile', profile, '--scope', scope, '--project', project, '--dry-run']);
  assertExists(paths.state);

  log('');
  log('Generated files sample:');
  for (const file of listFiles(project)) log(file);

  log('');
  log('DIST TEST PASS');
  log(`log: ${logFile}`);
  log(`project: ${project}`);
  if (!keepProject && path.basename(project).startsWith('agent-bundle-dist-test-')) {
    fs.rmSync(project, { recursive: true, force: true });
    log('project cleanup: removed');
  } else {
    log(keepProject ? 'project cleanup: kept' : 'project cleanup: skipped for non-generated project path');
  }
} catch (error) {
  exitCode = 1;
  log('');
  log('DIST TEST FAIL');
  log(error && error.stack ? error.stack : String(error));
  log(`log: ${logFile}`);
  log(`project: ${project}`);
}

process.exit(exitCode);
