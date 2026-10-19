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
// lands. Frozen: four call paths return this object by reference, so one
// caller must never be able to edit the answer the next caller receives.
const tmuxResult = Object.freeze({ accepted: true, bytesWritten: 0 });

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

  // The visible screen text: a tmux pane, or an Orca tab's terminal tail.
  // Both transports can show the same Claude question modal.
  async function readScreen(target, lines = 40) {
    if (target.kind === 'tmux') return tmux.capturePane(target.sessionName, -lines);
    return orca.readTail(target.handle);
  }

  // The Claude session id bound to this target, or null. A tmux session keeps
  // it in a session option; an Orca tab reports it through the transcript pin
  // instead, so this layer never invents one.
  async function getBoundSessionId(target) {
    if (target.kind !== 'tmux') return null;
    return tmux.getSessionOption(target.sessionName, '@claude_session_id');
  }

  // How long to wait before a second listing confirms an absence. A row can be
  // missing from one reading, and the tab still runs.
  const ABSENT_CONFIRM_DELAY_MS = 500;

  // The listing plus its scope. A client that cannot report the scope is read
  // as a complete local inventory, which is what older Orca versions send.
  async function readListing() {
    if (typeof orca.listDetailed === 'function') return orca.listDetailed();
    const terminals = await orca.list();
    if (!Array.isArray(terminals)) return null;
    return { terminals, truncated: false, hostScope: null };
  }

  // True only when the listing positively covers this bridge's host. An
  // omitted host makes an absent row unverifiable, not dead.
  function coversLocalHost(hostScope) {
    if (!hostScope) return true;
    const omitted = Array.isArray(hostScope.omittedHostIds) ? hostScope.omittedHostIds : [];
    if (omitted.includes('local')) return false;
    const covered = Array.isArray(hostScope.hostIds) ? hostScope.hostIds : null;
    return covered === null || covered.includes('local');
  }

  async function probeAlive(target) {
    const listing = await readListing();
    if (!listing) return null;
    const found = listing.terminals.find((t) => t && t.handle === target.handle);
    // `connected` says that a client is attached, not that the agent lives.
    // The user can close Orca while Claude keeps working.
    if (found) return true;
    // Upstream invariant: an absent row is evidence of exit only inside a
    // complete, positively covered inventory.
    if (listing.truncated || !coversLocalHost(listing.hostScope)) return null;
    return false;
  }

  // Only an absence that holds on a second probe is death. Everything else is
  // either alive or unknown (null), and unknown never ends a session.
  async function isAlive(target) {
    if (target.kind === 'tmux') {
      try {
        return Boolean(await tmux.hasSession(target.sessionName));
      } catch {
        return null;
      }
    }
    try {
      const first = await probeAlive(target);
      if (first !== false) return first;
      await sleep(ABSENT_CONFIRM_DELAY_MS);
      return await probeAlive(target);
    } catch {
      return null;
    }
  }

  // 'working' | 'idle' | null. A tmux session has no cheap probe: the reader's
  // events drive the typing indicator there.
  async function status(target) {
    if (target.kind === 'tmux') return null;
    // An unreadable status is unknown, which is the same answer as null.
    try {
      const answer = await orca.agentStatus(target.handle);
      return answer?.status ?? null;
    } catch {
      return null;
    }
  }

  // Whether Orca itself thinks the agent is running (true/false), or null for a
  // transport that cannot say (tmux, or an Orca tab whose probe failed). This
  // is Orca's own authoritative signal, so it wins over any reading derived
  // from the transcript.
  async function agentRunning(target) {
    if (target.kind === 'tmux') return null;
    try {
      const answer = await orca.agentStatus(target.handle);
      if (typeof answer?.isRunningAgent === 'boolean') return answer.isRunningAgent;
      return null;
    } catch {
      return null;
    }
  }

  return { sendText, sendKeys, interrupt, getBoundSessionId, isAlive, status, agentRunning, readScreen };
}
