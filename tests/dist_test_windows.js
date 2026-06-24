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

function quoteCmdArg(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function spawnPortable(command, args, options) {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)) {
    // cmd.exe /s strips exactly one outer quote pair, so wrap the whole
    // already-quoted command line in an extra pair. windowsVerbatimArguments
    // stops Node from re-escaping the inner quotes into `\"` (which cmd cannot parse).
    const inner = [quoteCmdArg(command), ...args.map(quoteCmdArg)].join(' ');
    const commandLine = `"${inner}"`;
    return spawnSync('cmd.exe', ['/d', '/s', '/c', commandLine], {
      ...options,
      windowsVerbatimArguments: true,
    });
  }
  return spawnSync(command, args, options);
}

function run(label, command, args, options = {}) {
  log('');
  log(`==> ${label}`);
  const spawnOptions = {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    shell: false,
    env: { ...process.env, FORCE_COLOR: '0' },
  };
  const result = spawnPortable(command, args, spawnOptions);
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

function targetPaths(base = project) {
  if (target === 'codex') {
    return {
      entry: path.join(base, 'AGENTS.md'),
      state: path.join(base, '.agent-deploy', 'install-state.json'),
      feedbackSkill: path.join(base, '.agents', 'skills', 'agent-bundle-feedback', 'SKILL.md'),
      config: path.join(base, '.codex', 'config.toml'),
    };
  }
  if (target === 'gemini') {
    return {
      entry: path.join(base, 'GEMINI.md'),
      state: path.join(base, '.agent-deploy', 'install-state.json'),
      feedbackSkill: path.join(base, '.gemini', 'skills', 'agent-bundle-feedback', 'SKILL.md'),
      config: null,
    };
  }
  if (target === 'claude') {
    return {
      entry: null,
      state: path.join(base, '.claude', 'agent-install-state.json'),
      feedbackSkill: path.join(base, '.claude', 'skills', 'agent-bundle-feedback', 'SKILL.md'),
      config: path.join(base, '.mcp.json'),
    };
  }
  if (target === 'cursor') {
    return {
      entry: null,
      state: path.join(base, '.cursor', 'agent-install-state.json'),
      feedbackSkill: path.join(base, '.cursor', 'skills', 'agent-bundle-feedback', 'SKILL.md'),
      config: path.join(base, '.cursor', 'mcp.json'),
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

  // install.bat smoke: the cli.js steps above never touch the shipped Windows
  // entry point, so exercise it directly. install.bat uses %CD% as the project
  // root, so run it from a path WITH SPACES — the most common Windows quoting
  // failure point — and confirm the bundle lands in that exact path.
  const installBat = path.join(deployDir, 'install.bat');
  if (process.platform !== 'win32') {
    log('');
    log('install.bat smoke skipped: not win32');
  } else if (scope !== 'project') {
    log('');
    log('install.bat smoke skipped: scope is not project (avoids writing outside the test project)');
  } else if (!fs.existsSync(installBat)) {
    log('');
    log(`install.bat smoke skipped: not found at ${installBat}`);
  } else {
    const spaceProject = path.join(os.tmpdir(), `agent bundle install-bat ${timestamp}`);
    fs.mkdirSync(spaceProject, { recursive: true });
    const sp = targetPaths(spaceProject);
    run('install.bat apply (spaces path)', installBat, ['--target', target, '--profile', profile], { cwd: spaceProject });
    if (sp.entry) assertExists(sp.entry);
    assertExists(sp.state);
    assertExists(sp.feedbackSkill);
    if (sp.config) assertExists(sp.config);
    run('install.bat uninstall dry-run (spaces path)', nodeCommand, [cliJs, 'uninstall', '--target', target, '--profile', profile, '--scope', scope, '--project', spaceProject, '--dry-run']);
    assertExists(sp.state);
    if (!keepProject && path.basename(spaceProject).startsWith('agent bundle install-bat')) {
      fs.rmSync(spaceProject, { recursive: true, force: true });
      log('install.bat smoke project cleanup: removed');
    } else {
      log(`install.bat smoke project: kept at ${spaceProject}`);
    }
  }

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
