import fs from 'node:fs/promises';
import path from 'node:path';

const LOG_PATH = path.resolve('publish-log.json');

export async function appendPublishLog(entry) {
  let existing = [];

  try {
    existing = JSON.parse(await fs.readFile(LOG_PATH, 'utf8'));
  } catch {
    existing = [];
  }

  existing.unshift({
    time: new Date().toISOString(),
    ...entry,
  });

  await fs.writeFile(LOG_PATH, JSON.stringify(existing.slice(0, 50), null, 2));
}

export async function readPublishLog() {
  try {
    return JSON.parse(await fs.readFile(LOG_PATH, 'utf8'));
  } catch {
    return [];
  }
}
