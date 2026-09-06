import { exec as defaultExec } from 'node:child_process';

export class TmuxController {
  constructor(tmuxPath = 'tmux', execFn = defaultExec) {
    this.tmuxPath = tmuxPath;
    this.execFn = execFn;
  }

  execAsync(cmd) {
    return new Promise((resolve, reject) => {
      this.execFn(cmd, (err, stdout, stderr) => {
        if (err) return reject(err);
        resolve({ stdout: stdout || '', stderr: stderr || '' });
      });
    });
  }

  async hasSession(sessionName) {
    try {
      await this.execAsync(`${this.tmuxPath} has-session -t "${sessionName}"`);
      return true;
    } catch {
      return false;
    }
  }

  async listSessions(prefix = '') {
    try {
      const { stdout } = await this.execAsync(`${this.tmuxPath} list-sessions -F "#{session_name}"`);
      const all = stdout.split('\n').map(s => s.trim()).filter(Boolean);
      return prefix ? all.filter(s => s.startsWith(prefix)) : all;
    } catch {
      return [];
    }
  }

  normalizePath(p) {
    if (this.tmuxPath.includes('wsl') && /^[a-zA-Z]:[\\/]/.test(p)) {
      const drive = p[0].toLowerCase();
      const rest = p.slice(2).replace(/\\/g, '/');
      return `/mnt/${drive}${rest.startsWith('/') ? rest : '/' + rest}`;
    }
    return p;
  }

  async newSession(sessionName, cwd, command = 'claude') {
    const targetCwd = this.normalizePath(cwd);
    const safeSession = sessionName.replace(/"/g, '\\"');
    const safeCwd = targetCwd.replace(/"/g, '\\"');
    const safeCmd = command.replace(/"/g, '\\"');
    const cmd = `${this.tmuxPath} new-session -d -s "${safeSession}" -c "${safeCwd}" "${safeCmd}"`;
    await this.execAsync(cmd);
  }

  async killSession(sessionName) {
    try {
      await this.execAsync(`${this.tmuxPath} kill-session -t "${sessionName}"`);
    } catch (err) {
      if (!err.message?.includes('no server running') && !err.message?.includes('session not found')) {
        throw err;
      }
    }
  }

  async sendKeys(sessionName, text, pressEnter = true) {
    const escaped = text.replace(/"/g, '\\"');
    let cmd = `${this.tmuxPath} send-keys -t "${sessionName}" -l "${escaped}"`;
    if (pressEnter) {
      cmd += ` && ${this.tmuxPath} send-keys -t "${sessionName}" Enter`;
    }
    await this.execAsync(cmd);
  }

  async capturePane(sessionName, startLine = -100) {
    try {
      const { stdout } = await this.execAsync(
        `${this.tmuxPath} capture-pane -p -t "${sessionName}" -S ${startLine}`
      );
      return stdout;
    } catch (err) {
      if (err.message?.includes('session not found')) {
        return '';
      }
      throw err;
    }
  }

  async setSessionOption(sessionName, key, value) {
    const safeSession = sessionName.replace(/"/g, '\\"');
    const safeValue = String(value).replace(/"/g, '\\"');
    await this.execAsync(`${this.tmuxPath} set-option -t "${safeSession}" ${key} "${safeValue}"`);
  }

  async getSessionOption(sessionName, key) {
    try {
      const safeSession = sessionName.replace(/"/g, '\\"');
      const { stdout } = await this.execAsync(`${this.tmuxPath} show-options -v -t "${safeSession}" ${key}`);
      const value = stdout.trim();
      return value || null;
    } catch {
      // Unset option or dead session -> caller falls back.
      return null;
    }
  }
}
