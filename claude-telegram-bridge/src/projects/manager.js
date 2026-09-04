import fs from 'node:fs/promises';
import path from 'node:path';
import { readOrcaProjects } from './orca_reader.js';

export class ProjectManager {
  constructor(projectsDir, tmuxController, deps = {}) {
    this.projectsDir = projectsDir;
    this.controller = tmuxController;
    this.orcaReader = deps.orcaReader || readOrcaProjects;
  }

  normalizeSessionName(name) {
    if (!name) return 'default';
    return name.replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  async listProjects() {
    try {
      // 1. Try calling orcaReader
      let projects = [];
      try {
        const orcaItems = await this.orcaReader();
        if (Array.isArray(orcaItems) && orcaItems.length > 0) {
          projects = orcaItems.map(item => ({
            name: item.name,
            displayName: item.displayName || item.name,
            path: item.path,
            kind: item.kind || 'orca'
          }));
        }
      } catch {}

      // 2. Fallback to reading directories from projectsDir if no orca projects
      if (projects.length === 0) {
        try {
          const entries = await fs.readdir(this.projectsDir, { withFileTypes: true });
          const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
          projects = dirs.map(d => ({
            name: d.name,
            displayName: d.name,
            path: path.join(this.projectsDir, d.name),
            kind: 'directory'
          }));
        } catch {}
      }

      const activeSessions = await this.controller.listSessions('claude-');

      return projects.map(p => {
        const normName = this.normalizeSessionName(p.name);
        const sessionPrefix = `claude-${normName}`;
        const running = activeSessions.filter(s => s === sessionPrefix || s.startsWith(`${sessionPrefix}-`));
        return {
          name: p.name,
          displayName: p.displayName || p.name,
          path: p.path,
          kind: p.kind,
          runningSessions: running
        };
      });
    } catch {
      return [];
    }
  }

  async startFreshSession(projectName, projectPath) {
    const normName = this.normalizeSessionName(projectName);
    const sessionName = `claude-${normName}`;
    const resolvedPath = projectPath || path.join(this.projectsDir, projectName);

    if (await this.controller.hasSession(sessionName)) {
      await this.controller.killSession(sessionName);
    }

    await this.controller.newSession(sessionName, resolvedPath, 'claude');
    return sessionName;
  }

  async killCurrentSession(projectName) {
    const normName = this.normalizeSessionName(projectName);
    const sessionName = `claude-${normName}`;
    if (await this.controller.hasSession(sessionName)) {
      await this.controller.killSession(sessionName);
    }
  }

  async killProjectSessions(projectName) {
    const normName = this.normalizeSessionName(projectName);
    const sessionPrefix = `claude-${normName}`;
    const all = await this.controller.listSessions('claude-');
    const toKill = all.filter(s => s === sessionPrefix || s.startsWith(`${sessionPrefix}-`));
    for (const sess of toKill) {
      await this.controller.killSession(sess);
    }
  }
}
