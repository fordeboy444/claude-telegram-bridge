import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * Candidate Orca config directories, best first.
 *
 * The spelling differs by platform: the Windows desktop app uses "Orca", the
 * Linux server build uses "orca". Linux filesystems are case-sensitive, so a
 * single hard-coded spelling silently reads nothing on the other platform.
 * @returns {string[]} absolute candidate directories, best first
 */
export function getOrcaConfigDirCandidates({ platform = process.platform, env = process.env, homedir = os.homedir() } = {}) {
  if (platform === 'win32') {
    const appData = env.APPDATA || path.join(homedir, 'AppData', 'Roaming');
    return [path.join(appData, 'Orca'), path.join(appData, 'orca')];
  }
  const configDir = env.XDG_CONFIG_HOME || path.join(homedir, '.config');
  return [path.join(configDir, 'orca'), path.join(configDir, 'Orca')];
}

/**
 * Returns the default path for Orca's legacy JSON configuration.
 * @returns {string}
 */
export function getDefaultOrcaDataPath(opts) {
  return path.join(getOrcaConfigDirCandidates(opts)[0], 'profiles', 'local-default', 'orca-data.json');
}

/**
 * Returns the default path for Orca's live SQLite profile store. Orca writes
 * this file continuously and stopped updating orca-data.json when it migrated.
 * @returns {string}
 */
export function getDefaultOrcaDbPath(opts) {
  return path.join(getOrcaConfigDirCandidates(opts)[0], 'profiles', 'local-default', 'profile-state.db');
}

/**
 * Correlates Orca projects with the repository paths they point at. Accepts
 * both the project.displayName || project.name and the sourceRepoIds ||
 * repoIds schema variants, so one shape works for the JSON and SQLite stores.
 *
 * The matched repo ids are kept on the result. A caller matches a live Orca
 * terminal tab to a project by repo id (never by path string), so the ids
 * must survive this function. `[]` means "no known repo id".
 * @returns {Array<{name: string, displayName: string, path: string|null, kind: string, repoIds: string[]}>}
 */
export function correlateOrcaProjects(repos, projects) {
  if (!Array.isArray(projects)) return [];

  const reposMap = new Map();
  if (Array.isArray(repos)) {
    for (const repo of repos) {
      if (repo && repo.id) reposMap.set(repo.id, repo.path || null);
    }
  }

  const results = [];
  for (const project of projects) {
    if (!project) continue;
    const projectName = project.name || project.displayName;
    if (!projectName) continue;

    const repoIds = project.sourceRepoIds || project.repoIds || [];
    const repoIdList = Array.isArray(repoIds) ? repoIds : [];
    let repoPath = null;
    if (repoIdList.length > 0) {
      for (const rId of repoIdList) {
        if (reposMap.has(rId)) {
          repoPath = reposMap.get(rId);
          break;
        }
      }
    }

    results.push({
      name: projectName,
      displayName: project.displayName || project.name,
      path: repoPath,
      kind: 'orca',
      repoIds: repoIdList
    });
  }
  return results;
}

/**
 * Reads and parses Orca's legacy JSON workspace configuration.
 * @param {string} [filePath] Optional custom path to orca-data.json
 * @returns {Promise<Array<{name: string, displayName: string, path: string|null, kind: string, repoIds: string[]}>>}
 */
export async function readOrcaProjects(filePath = getDefaultOrcaDataPath()) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    if (!data || !Array.isArray(data.projects)) return [];
    return correlateOrcaProjects(data.repos, data.projects);
  } catch {
    // Missing file, invalid JSON, or permission error -> return empty list gracefully
    return [];
  }
}

/**
 * Reads Orca's live SQLite profile store (profile-state.db). The store keeps
 * one JSON payload per domain in profile_state_documents; the repos and
 * projects domains are the ones the bridge needs. Opened read-only so a
 * running Orca is never disturbed, and it needs no npm dependency because
 * Node 22+ ships node:sqlite.
 * @param {string} [dbPath] Optional custom path to profile-state.db
 * @returns {Promise<Array<{name: string, displayName: string, path: string|null, kind: string, repoIds: string[]}>>}
 */
export async function readOrcaProjectsFromDb(dbPath = getDefaultOrcaDbPath()) {
  let db;
  try {
    const { DatabaseSync } = await import('node:sqlite');
    db = new DatabaseSync(dbPath, { readOnly: true });
    const rows = db
      .prepare("SELECT domain, payload FROM profile_state_documents WHERE domain IN ('repos', 'projects')")
      .all();
    const byDomain = new Map(rows.map(row => [row.domain, JSON.parse(row.payload)]));
    return correlateOrcaProjects(byDomain.get('repos'), byDomain.get('projects'));
  } catch {
    // Missing db, no node:sqlite, locked file, or bad payload -> empty list,
    // so the caller can fall through to the next source.
    return [];
  } finally {
    try {
      db?.close();
    } catch {}
  }
}

/**
 * Reads the Orca project list from the live store first, then from the legacy
 * JSON file. Orca migrated to SQLite on 2026-10-05 and stopped writing the
 * JSON, so the JSON is only a fallback for older installs.
 * @returns {Promise<Array<{name: string, displayName: string, path: string|null, kind: string, repoIds: string[]}>>}
 */
export async function readOrcaProjectsAuto(opts = {}) {
  const live = await readOrcaProjectsFromDb(opts.dbPath || getDefaultOrcaDbPath());
  if (live.length > 0) return live;
  return readOrcaProjects(opts.jsonPath || getDefaultOrcaDataPath());
}
