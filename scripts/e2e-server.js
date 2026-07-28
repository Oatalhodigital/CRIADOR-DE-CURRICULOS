const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || '3001';
const DIST_DIR = path.resolve(PROJECT_ROOT, process.env.NEXT_PRIVATE_DIST_DIR || '.next');
const NODE_MODULES_TARGET = path.join(PROJECT_ROOT, 'node_modules');
const DIST_NODE_MODULES = path.join(DIST_DIR, 'node_modules');

function ensureNodeModulesJunction() {
  try {
    if (fs.existsSync(DIST_NODE_MODULES)) {
      const stats = fs.lstatSync(DIST_NODE_MODULES);
      if (stats.isSymbolicLink() || stats.isDirectory()) return;
      fs.unlinkSync(DIST_NODE_MODULES);
    }
    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.symlinkSync(NODE_MODULES_TARGET, DIST_NODE_MODULES, 'junction');
  } catch (err) {
    // ignore races with next dev cleaning
  }
}

// Next.js dev cleans the distDir on startup. We keep a node_modules junction
// there so ESM imports from the build cache can resolve packages even when the
// cache is outside the project (e.g. outside OneDrive).
const junctionInterval = setInterval(ensureNodeModulesJunction, 300);
ensureNodeModulesJunction();

const nextBin = require.resolve('next/dist/bin/next');

const child = spawn(process.execPath, [nextBin, 'dev', '-p', String(PORT)], {
  cwd: PROJECT_ROOT,
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'inherit',
});

let cleanedUp = false;
function cleanup(signal) {
  if (cleanedUp) return;
  cleanedUp = true;
  clearInterval(junctionInterval);
  child.kill(signal || 'SIGTERM');
}

process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));

child.on('exit', (code) => {
  clearInterval(junctionInterval);
  process.exit(code ?? 1);
});
