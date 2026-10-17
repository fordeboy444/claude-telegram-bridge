// claude-telegram-bridge/src/session/target.js
// The target record and the transport-neutral session IO layer.
//
// A "target" names where a Claude session lives: a tmux session, or an Orca
// agent tab. Everything above this file holds a target and calls `io.*`. The
// `kind` branch lives in this module alone, so no other module ever asks which
// transport it holds.
import { keyToBytes } from '../orca/keys.js';

// The default gap between two keystrokes on an Orca tab. The Claude Code
// question modal redraws between keystrokes and drops keys that arrive in one
// fast burst, so one key per round trip, spaced out.
const DEFAULT_KEY_DELAY_MS = 300;

/**
 * A tmux session target.
 *
 * @param {string} sessionName
 * @param {string|null} projectPath
 * @returns {{kind: 'tmux', sessionName: string, projectPath: string|null}}
 */
export function tmuxTarget(sessionName, projectPath) {
  return { kind: 'tmux', sessionName, projectPath };
}

/**
 * An Orca agent tab target.
 *
 * @param {{handle: string, title: string, projectPath: string|null, transcriptFile: string|null}} tab
 * @returns {{kind: 'orca', handle: string, title: string, projectPath: string|null, transcriptFile: string|null}}
 */
export function orcaTarget({ handle, title, projectPath, transcriptFile }) {
  return { kind: 'orca', handle, title, projectPath, transcriptFile };
}

// The one-line name of a target, for menus and messages.
export function targetLabel(target) {
  return target.kind === 'tmux' ? target.sessionName : target.title;
}

// A tmux answer. The controller reports no byte count, and a tmux key always
// lands.
const tmuxResult = { accepted: true, bytesWritten: 0 };

/**
 * The IO layer both transports hide behind.
 *
 * @param {{tmux: object, orca: object, sleep?: (ms: number) => Promise<void>}} deps
 */
export function createSessionIo({ tmux, orca, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  // The Orca client answers {handle, accepted, bytesWritten}; the tmux
  // controller has no such answer. Normalize both to the same shape.
  const fromOrca = (answer) => ({ accepted: answer.accepted, bytesWritten: answer.bytesWritten });

  async function sendText(target, text, pressEnter = true) {
    if (target.kind === 'tmux') {
      await tmux.sendKeys(target.sessionName, text, pressEnter);
      return tmuxResult;
    }
    // enter and interrupt are always explicit: an omitted key would leave the
    // Orca default in charge of submitting the prompt.
    return fromOrca(await orca.send(target.handle, { text, enter: pressEnter, interrupt: false }));
  }

  async function sendKeys(target, keys, delayMs = DEFAULT_KEY_DELAY_MS) {
    if (target.kind === 'tmux') {
      // tmux takes key NAMES. The mapping to bytes belongs to the Orca branch.
      await tmux.sendKeysWithDelay(target.sessionName, keys, delayMs);
      return tmuxResult;
    }

    const list = Array.isArray(keys) ? keys : [];
    let bytesWritten = 0;

    for (let i = 0; i < list.length; i++) {
      const bytes = keyToBytes(list[i]);
      if (bytes === null) {
        // A guessed byte could fire the wrong menu item. Stop instead.
        console.warn('⚠️ No Orca byte for key', list[i]);
        return { accepted: false, bytesWritten: 0 };
      }

      const answer = await orca.send(target.handle, { text: bytes, enter: false, interrupt: false });
      if (!answer.accepted) {
        // A half-typed key sequence is worthless, so the count is dropped too.
        return { accepted: false, bytesWritten: 0 };
      }
      bytesWritten += answer.bytesWritten;

      // Never sleep after the last key: the delay only spaces the keys apart.
      if (i < list.length - 1) await sleep(delayMs);
    }

    return { accepted: true, bytesWritten };
  }

  async function interrupt(target) {
    if (target.kind === 'tmux') {
      // delayMs 0: an interrupt must not wait.
      await tmux.sendKeysWithDelay(target.sessionName, ['Escape'], 0);
      return tmuxResult;
    }
    // An interrupt is its own Orca signal, not an Escape byte in the text
    // stream: send it with an empty body.
    return fromOrca(await orca.send(target.handle, { text: '', enter: false, interrupt: true }));
  }

  // The Claude session id bound to this target, or null. A tmux session keeps
  // it in a session option; an Orca tab reports it through the transcript pin
  // instead, so this layer never invents one.
  async function getBoundSessionId(target) {
    if (target.kind !== 'tmux') return null;
    return tmux.getSessionOption(target.sessionName, '@claude_session_id');
  }

  async function isAlive(target) {
    if (target.kind === 'tmux') return Boolean(await tmux.hasSession(target.sessionName));
    const terminals = await orca.list();
    return terminals.some((t) => t && t.handle === target.handle);
  }

  // 'working' | 'idle' | null. A tmux session has no cheap probe: the reader's
  // events drive the typing indicator there.
  async function status(target) {
    if (target.kind === 'tmux') return null;
    const answer = await orca.agentStatus(target.handle);
    return answer?.status ?? null;
  }

  return { sendText, sendKeys, interrupt, getBoundSessionId, isAlive, status };
}
