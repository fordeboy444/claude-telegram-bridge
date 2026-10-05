import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * Returns the default path for Orca configuration data.
 * On Windows: %APPDATA%/Orca/profiles/local-default/orca-data.json
 * On other OS: ~/.config/Orca/profiles/local-default/orca-data.json (or homedir fallback)
 */
export function getDefaultOrcaDataPath() {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'Orca', 'profiles', 'local-default', 'orca-data.json');
  } else {
    const configDir = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
    return path.join(configDir, 'Orca', 'profiles', 'local-default', 'orca-data.json');
  }
}

/**
 * Reads and parses Orca workspace configuration, returning a list of projects correlated with repository paths.
 * Supports both project.displayName || project.name and project.sourceRepoIds || project.repoIds.
 * @param {string} [filePath] Optional custom path to orca-data.json
 * @returns {Promise<Array<{name: string, displayName: string, path: string|null, kind: string}>>}
 */
export async function readOrcaProjects(filePath = getDefaultOrcaDataPath()) {
  try {
    // If using default path and file doesn't exist, return [] immediately so directory fallback works cleanly
    if (filePath === getDefaultOrcaDataPath()) {
      try {
        await fs.access(filePath);
      } catch {
        return [];
      }
    }

    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);

    if (!data || !Array.isArray(data.projects)) {
      return [];
    }

    const reposMap = new Map();
    if (Array.isArray(data.repos)) {
      for (const repo of data.repos) {
        if (repo && repo.id) {
          reposMap.set(repo.id, repo.path || null);
        }
      }
    }

    const results = [];
    for (const project of data.projects) {
      if (!project) continue;
      const projectName = project.name || project.displayName;
      if (!projectName) continue;
      const projectDisplayName = project.displayName || project.name;

      const repoIds = project.sourceRepoIds || project.repoIds || [];
      let repoPath = null;
      if (Array.isArray(repoIds) && repoIds.length > 0) {
        for (const rId of repoIds) {
          if (reposMap.has(rId)) {
            repoPath = reposMap.get(rId);
            break;
          }
        }
      }

      results.push({
        name: projectName,
        displayName: projectDisplayName,
        path: repoPath,
        kind: 'orca'
      });
    }

    return results;
  } catch (err) {
    // Missing file, invalid JSON, or permission error -> return empty list gracefully
    return [];
  }
}
