const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'bot-config.json');
const LEVELS_FILE = path.join(__dirname, '..', 'levels.json');
const ANALYTICS_FILE = path.join(__dirname, '..', 'analytics.json');

function readSync(file) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({}));
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8') || '{}');
  } catch {
    return {};
  }
}

const memoryStore = {
  config: readSync(CONFIG_FILE),
  levels: readSync(LEVELS_FILE),
  analytics: readSync(ANALYTICS_FILE),
};

const dirty = { config: false, levels: false, analytics: false };
const timers = { config: null, levels: null, analytics: null };

async function atomicWrite(filepath, data) {
  const tempPath = `${filepath}.${Date.now()}.tmp`;
  await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.promises.rename(tempPath, filepath);
}

function scheduleFlush(type, filepath) {
  dirty[type] = true;
  if (timers[type]) return;

  timers[type] = setTimeout(async () => {
    timers[type] = null;
    if (!dirty[type]) return;
    try {
      await atomicWrite(filepath, memoryStore[type]);
      dirty[type] = false;
    } catch (err) {
      console.error(`[Storage] Failed to flush ${type}:`, err.message);
    }
  }, 2000);
}

async function flushAllSync() {
  const promises = [];
  if (dirty.config) promises.push(atomicWrite(CONFIG_FILE, memoryStore.config));
  if (dirty.levels) promises.push(atomicWrite(LEVELS_FILE, memoryStore.levels));
  if (dirty.analytics) promises.push(atomicWrite(ANALYTICS_FILE, memoryStore.analytics));
  await Promise.all(promises);
}

process.on('SIGINT', async () => {
  await flushAllSync();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await flushAllSync();
  process.exit(0);
});

module.exports = {
  getConfig: () => memoryStore.config,
  saveConfig: () => scheduleFlush('config', CONFIG_FILE),

  getLevels: () => memoryStore.levels,
  saveLevels: () => scheduleFlush('levels', LEVELS_FILE),

  getAnalytics: () => memoryStore.analytics,
  saveAnalytics: () => scheduleFlush('analytics', ANALYTICS_FILE),

  flushAllSync,
};