import { cleanAnsi } from './formatter.js';

export class TmuxMonitor {
  constructor(tmuxController, sessionName, pollIntervalMs = 1000) {
    this.controller = tmuxController;
    this.sessionName = sessionName;
    this.pollIntervalMs = pollIntervalMs;
    this.lastLines = [];
    this.timer = null;
    this.isPolling = false;
  }

  computeDiff(previousLines, currentLines) {
    if (!previousLines || previousLines.length === 0) {
      return { newLines: currentLines, updatedBaseline: currentLines };
    }

    // Direct suffix match check (most common in terminal output)
    const prevText = previousLines.join('\n');
    const currText = currentLines.join('\n');

    if (currText.startsWith(prevText)) {
      const added = currText.slice(prevText.length).replace(/^\n/, '');
      const newLines = added ? added.split('\n') : [];
      return { newLines, updatedBaseline: currentLines };
    }

    // Line replacement at end (spinner or status updates)
    if (
      previousLines.length === currentLines.length &&
      previousLines.slice(0, -1).join('\n') === currentLines.slice(0, -1).join('\n')
    ) {
      const lastLine = currentLines[currentLines.length - 1];
      return { newLines: [lastLine], updatedBaseline: currentLines };
    }

    // Find longest matching overlap between suffix of previousLines and prefix of currentLines
    const maxOverlap = Math.min(previousLines.length, currentLines.length);
    for (let overlap = maxOverlap; overlap > 0; overlap--) {
      let matches = true;
      for (let i = 0; i < overlap; i++) {
        if (previousLines[previousLines.length - overlap + i] !== currentLines[i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        const newLines = currentLines.slice(overlap);
        return { newLines, updatedBaseline: currentLines };
      }
    }

    // Fallback: look for newly appended items from diff index
    let diffStart = 0;
    while (
      diffStart < previousLines.length &&
      diffStart < currentLines.length &&
      previousLines[diffStart] === currentLines[diffStart]
    ) {
      diffStart++;
    }

    const newLines = currentLines.slice(diffStart);
    return { newLines, updatedBaseline: currentLines };
  }

  start(onOutput) {
    if (this.timer) return;
    this.timer = setInterval(async () => {
      if (this.isPolling) return;
      this.isPolling = true;
      try {
        const raw = await this.controller.capturePane(this.sessionName, -100);
        if (!raw) return;

        const cleaned = cleanAnsi(raw);
        const lines = cleaned.split('\n');

        const { newLines, updatedBaseline } = this.computeDiff(this.lastLines, lines);
        this.lastLines = updatedBaseline;

        const outputText = newLines.join('\n').trim();
        if (outputText) {
          onOutput(outputText);
        }
      } catch (err) {
        // Suppress expected session close/polling errors
      } finally {
        this.isPolling = false;
      }
    }, this.pollIntervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
