import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import {
  getOrcaConfigDirCandidates,
  getDefaultOrcaDataPath,
  getDefaultOrcaDbPath,
  readOrcaProjectsFromDb,
  readOrcaProjectsAuto
} from '../src/projects/orca_reader.js';

// Orca moved its live store from orca-data.json to profile-state.db (SQLite).
// The schema mirrors the real one: one JSON payload per domain, with the
// repos and projects domains holding arrays.
function writeProfileStateDb(dbPath, domains) {
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE profile_state_documents (
    domain TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL,
    domain_version INTEGER NOT NULL, revision INTEGER NOT NULL,
    updated_at INTEGER NOT NULL, content_hash TEXT NOT NULL
  )`);
  const stmt = db.prepare(
    'INSERT INTO profile_state_documents (domain, payload, domain_version, revision, updated_at, content_hash) VALUES (?, ?, 1, 1, 1, ?)'
  );
  for (const [domain, payload] of Object.entries(domains)) {
    stmt.run(domain, JSON.stringify(payload), 'hash');
  }
  db.close();
}

const LIVE_DOMAINS = {
  repos: [
    { id: 'r1', path: '/home/orca/Projects/Main Agent', displayName: 'Main Agent', kind: 'folder' },
    { id: 'r2', path: '/home/orca/Projects/2ND Brain', displayName: '2ND Brain', kind: 'folder' }
  ],
  projects: [
    { id: 'repo:r1', displayName: 'Main Agent', sourceRepoIds: ['r1'] },
    { id: 'repo:r2', displayName: '2ND Brain', sourceRepoIds: ['r2'] }
  ]
};

test('getOrcaConfigDirCandidates prefers lowercase orca on linux and Orca on windows', () => {
  const linux = getOrcaConfigDirCandidates({
    platform: 'linux', env: {}, homedir: '/home/orca'
  });
  assert.equal(linux[0], path.join('/home/orca', '.config', 'orca'));

  const win = getOrcaConfigDirCandidates({
    platform: 'win32', env: { APPDATA: 'C:\\Users\\x\\AppData\\Roaming' }, homedir: 'C:\\Users\\x'
  });
  assert.equal(win[0], path.join('C:\\Users\\x\\AppData\\Roaming', 'Orca'));
});

test('getDefaultOrcaDataPath points at the lowercase orca config dir on linux', () => {
  // The live host directory is /home/orca/.config/orca; a capital Orca dir
  // never exists there, so the whole read silently returned nothing.
  const linuxPath = getDefaultOrcaDataPath({
    platform: 'linux', env: {}, homedir: '/home/orca'
  });
  assert.equal(linuxPath, path.join('/home/orca', '.config', 'orca', 'profiles', 'local-default', 'orca-data.json'));
});

test('getDefaultOrcaDbPath points at profile-state.db beside orca-data.json', () => {
  const dbPath = getDefaultOrcaDbPath({
    platform: 'linux', env: {}, homedir: '/home/orca'
  });
  assert.equal(dbPath, path.join('/home/orca', '.config', 'orca', 'profiles', 'local-default', 'profile-state.db'));
});

test('readOrcaProjectsFromDb correlates live repos with their projects', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orca-db-'));
  const dbPath = path.join(tmpDir, 'profile-state.db');
  writeProfileStateDb(dbPath, LIVE_DOMAINS);

  const projects = await readOrcaProjectsFromDb(dbPath);

  assert.equal(projects.length, 2);
  const mainAgent = projects.find(p => p.name === 'Main Agent');
  assert.ok(mainAgent);
  assert.equal(mainAgent.path, '/home/orca/Projects/Main Agent');
  assert.equal(mainAgent.kind, 'orca');

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('readOrcaProjectsFromDb returns [] for a missing db or a db without projects', async () => {
  const missing = await readOrcaProjectsFromDb(path.join(os.tmpdir(), 'no-such-profile-state.db'));
  assert.deepEqual(missing, []);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orca-db-empty-'));
  const dbPath = path.join(tmpDir, 'profile-state.db');
  writeProfileStateDb(dbPath, { settings: { theme: 'dark' } });
  assert.deepEqual(await readOrcaProjectsFromDb(dbPath), []);

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('readOrcaProjectsAuto prefers the live db over the legacy json', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orca-auto-'));
  const dbPath = path.join(tmpDir, 'profile-state.db');
  const jsonPath = path.join(tmpDir, 'orca-data.json');
  writeProfileStateDb(dbPath, LIVE_DOMAINS);
  // A stale json listing a project whose path no longer exists.
  await fs.writeFile(jsonPath, JSON.stringify({
    projects: [{ id: 'p1', name: 'Stale Project', sourceRepoIds: ['old'] }],
    repos: [{ id: 'old', path: '/home/orca/Agents/Stale Project' }]
  }), 'utf8');

  const projects = await readOrcaProjectsAuto({ dbPath, jsonPath });

  assert.equal(projects.length, 2);
  assert.equal(projects.some(p => p.name === 'Stale Project'), false);

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('readOrcaProjectsAuto falls back to the legacy json when the db is absent', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orca-auto-fb-'));
  const jsonPath = path.join(tmpDir, 'orca-data.json');
  await fs.writeFile(jsonPath, JSON.stringify({
    projects: [{ id: 'p1', name: 'Legacy Project', sourceRepoIds: ['r1'] }],
    repos: [{ id: 'r1', path: '/legacy/path' }]
  }), 'utf8');

  const projects = await readOrcaProjectsAuto({
    dbPath: path.join(tmpDir, 'absent.db'), jsonPath
  });

  assert.equal(projects.length, 1);
  assert.equal(projects[0].name, 'Legacy Project');
  assert.equal(projects[0].path, '/legacy/path');

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('readOrcaProjectsAuto returns [] when both stores are unreadable', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orca-auto-none-'));
  const projects = await readOrcaProjectsAuto({
    dbPath: path.join(tmpDir, 'absent.db'),
    jsonPath: path.join(tmpDir, 'absent.json')
  });
  assert.deepEqual(projects, []);
  await fs.rm(tmpDir, { recursive: true, force: true });
});
