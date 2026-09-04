import fs from 'node:fs/promises';
import path from 'node:path';

export class ProjectManager {
  constructor(projectsDir, tmuxController) {
    this.projectsDir = projectsDir;
    this.controller = tmuxController;
  }

  async listProjects() {
    try {
      const entries = await fs.readdir(this.projectsDir, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
      const activeSessions = await this.controller.listSessions('claude-');

      return dirs.map(d => {
        const fullPath = path.join(this.projectsDir, d.name);
        const sessionPrefix = `claude-${d.name}`;
        const running = activeSessions.filter(s => s === sessionPrefix || s.startsWith(`${sessionPrefix}-`));
        return {
          name: d.name,
          path: fullPath,
          runningSessions: running
        };
      });
    } catch {
      return [];
    }
  }

  async startFreshSession(projectName) {
    const sessionName = `claude-${projectName}`;
    const projectPath = path.join(this.projectsDir, projectName);

    if (await this.controller.hasSession(sessionName)) {
      await this.controller.killSession(sessionName);
    }

    await this.controller.newSession(sessionName, projectPath, 'claude');
    return sessionName;
  }

  async killProjectSessions(projectName) {
    const sessionPrefix = `claude-${projectName}`;
    const all = await this.controller.listSessions('claude-');
    const toKill = all.filter(s => s === sessionPrefix || s.startsWith(`${sessionPrefix}-`));
    for (const sess of toKill) {
      await this.controller.killSession(sess);
    }
  }
}
