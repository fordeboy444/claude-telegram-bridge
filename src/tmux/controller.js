import { execFile as defaultExecFile } from 'node:child_process';

export class TmuxController {
  // TMUX_PATH may carry interop args (e.g. "wsl -d Ubuntu tmux"). Split the
  // configured value once here: first token is the binary, the rest are
  // prefix arguments. No user-supplied data is ever part of this value.
  constructor(tmuxPath = 'tmux', execFn = defaultExecFile) {
    this.tmuxPath = tmuxPath;
    const parts = tmuxPath.trim().split(/\s+/);
    this.execFile = parts[0];
    this.execPrefixArgs = parts.slice(1);
    this.execFn = execFn;
  }

  // Runs the tmux binary with an argv array -- never through a shell -- so
  // no user text can ever be parsed by /bin/sh.
  execAsync(args) {
    return new Promise((resolve, reject) => {
      this.execFn(this.execFile, [...this.execPrefixArgs, ...args], (err, stdout, stderr) => {
        if (err) return reject(err);
        resolve({ stdout: stdout || '', stderr: stderr || '' });
      });
    });
  }

  async hasSession(sessionName) {
    try {
      await this.execAsync(['has-session', '-t', sessionName]);
      return true;
    } catch {
      return false;
    }
  }

  async listSessions(prefix = '') {
    try {
      const { stdout } = await this.execAsync(['list-sessions', '-F', '#{session_name}']);
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
    await this.execAsync(['new-session', '-d', '-s', sessionName, '-c', targetCwd, command]);
  }

  async killSession(sessionName) {
    try {
      await this.execAsync(['kill-session', '-t', sessionName]);
    } catch (err) {
      if (!err.message?.includes('no server running') && !err.message?.includes('session not found')) {
        throw err;
      }
    }
  }

  async sendKeys(sessionName, text, pressEnter = true) {
    await this.execAsync(['send-keys', '-t', sessionName, '-l', text]);
    if (pressEnter) {
      await this.execAsync(['send-keys', '-t', sessionName, 'Enter']);
    }
  }

  async sendKeySequence(sessionName, keys = []) {
    if (!keys || keys.length === 0) return;
    for (const k of keys) {
      await this.execAsync(['send-keys', '-t', sessionName, k]);
    }
  }

  // The Claude Code question modal redraws between keystrokes and drops keys
  // that arrive in one fast burst, so space keys out one exec at a time.
  // Keys are tmux key names (Enter, Right, Space, Down, single digits).
  async sendKeysWithDelay(sessionName, keys = [], delayMs = 300) {
    if (!keys || keys.length === 0) return;
    for (const k of keys) {
      await this.execAsync(['send-keys', '-t', sessionName, k]);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  async capturePane(sessionName, startLine = -100) {
    try {
      const { stdout } = await this.execAsync(
        ['capture-pane', '-p', '-t', sessionName, '-S', String(startLine)]
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
    await this.execAsync(['set-option', '-t', sessionName, key, String(value)]);
  }

  async getSessionOption(sessionName, key) {
    try {
      const { stdout } = await this.execAsync(['show-options', '-v', '-t', sessionName, key]);
      const value = stdout.trim();
      return value || null;
    } catch {
      // Unset option or dead session -> caller falls back.
      return null;
    }
  }
}