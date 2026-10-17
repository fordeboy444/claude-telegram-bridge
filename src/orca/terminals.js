// claude-telegram-bridge/src/orca/terminals.js
// Which Orca tabs run an agent, and which Claude transcript belongs to each.
// This module only reads Orca's terminal list and the transcript directory: the
// terminal SCREEN is never read, because Telegram text must come from the
// transcript file alone.
import fs from 'node:fs/promises';
import path from 'node:path';
import { getProjectSlug } from '../tmux/session_reader.js';

// Orca puts a state glyph in front of every tab title (✳ idle, ◐ working, …).
// The glyph changes with the state, so drop the whole leading run of
// non-alphanumeric characters instead of one known character.
export function stripTitleGlyph(title) {
  const text = typeof title === 'string' ? title : '';
  const stripped = text.replace(/^[^\p{L}\p{N}]+/u, '');
  // A title that holds nothing but glyphs keeps its text: an empty row name
  // tells the Telegram user nothing.
  return stripped === '' ? text.trim() : stripped;
}

// A worktree id is "<repoId>::<path>", or a plain path. Only the repo id in the
// first form identifies the project: a path changes, a repo id does not.
export function repoIdFromWorktreeId(worktreeId) {
  if (typeof worktreeId !== 'string') return null;
  const index = worktreeId.indexOf('::');
  if (index <= 0) return null; // no '::' at all, or nothing in front of it
  return worktreeId.slice(0, index);
}

// The absolute directory Claude Code writes this project's transcripts to.
// Synchronous on purpose: the caller holds a tab, not a filesystem handle.
// getProjectSlug is the shared slugger, so this cannot drift from the tmux
// reader. The directory may not exist yet; that is the caller's problem.
export function projectDirFor(projectPath, claudeHome) {
  return path.join(claudeHome, 'projects', getProjectSlug(projectPath));
}

// The tabs a user can join: connected, and running a Claude agent. A shell tab
// has no transcript, and a disconnected tab cannot be typed into.
export async function listAgentTabs(client) {
  const records = await client.list();
  const tabs = [];

  for (const record of records) {
    if (!record || record.connected !== true) continue;
    const handle = record.handle;
    if (typeof handle !== 'string' || handle === '') continue;

    // ONLY this probe degrades. One tab whose answer never comes must not empty
    // the picker (spec §8 B2: a plain message, never a throw), but a broken
    // list() above still reaches the caller, which owns that message.
    let probe;
    try {
      probe = await client.agentStatus(handle);
    } catch (err) {
      console.warn('⚠️ Orca tab probe failed (' + handle + '):', err?.message ?? String(err));
      continue;
    }
    if (probe?.isRunningAgent !== true) continue;

    const title = typeof record.title === 'string' ? record.title : '';
    tabs.push({
      handle,
      title,
      cleanTitle: stripTitleGlyph(title),
      projectPath: record.worktreePath ?? null,
      repoId: repoIdFromWorktreeId(record.worktreeId),
      status: probe.status ?? null
    });
  }

  return tabs;
}

// A transcript's first record carries the cwd, and a transcript grows to
// megabytes, so only the first line is ever read. 8192 bytes covers a first
// record with room to spare.
const FIRST_RECORD_BYTES = 8192;

// The parsed first record of a transcript, or null when the file is unreadable
// or the first line is not JSON. A malformed file is not an error here: it
// simply is not a candidate.
async function readFirstRecord(filePath) {
  let handle = null;
  try {
    handle = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(FIRST_RECORD_BYTES);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const newline = buffer.subarray(0, bytesRead).indexOf(0x0a);
    const line = buffer.toString('utf8', 0, newline === -1 ? bytesRead : newline);
    if (line.trim() === '') return null;
    const record = JSON.parse(line);
    return record && typeof record === 'object' ? record : null;
  } catch {
    return null;
  } finally {
    if (handle) await handle.close().catch(() => {});
  }
}

// Claude writes an `ai-title` record into the transcript of every session, and
// Orca shows that same string as the tab title. That makes the title an exact
// link from a tab to its own transcript. The record repeats through the file,
// and the last one sits near the end: measured 69 KB from EOF on a 22 MB live
// transcript. A 256 KB tail covers it with room to spare, and the head of a
// multi-megabyte file is never read.
const TAIL_RECORD_BYTES = 262144;

// The last ai-title in a transcript, or null when the tail holds none.
async function readLastAiTitle(filePath) {
  let handle = null;
  try {
    handle = await fs.open(filePath, 'r');
    const { size } = await handle.stat();
    const length = Math.min(size, TAIL_RECORD_BYTES);
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, size - length);

    // Walk backwards: the newest title is the one Orca displays.
    const lines = buffer.toString('utf8').split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line === '') continue;
      let record;
      // A tail that starts mid-line, and a file caught mid-write, both land
      // here as unparseable text. Neither is an error.
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }
      if (record && record.type === 'ai-title' && typeof record.aiTitle === 'string') {
        return record.aiTitle;
      }
    }
    return null;
  } catch {
    return null; // unreadable file: simply not a candidate
  } finally {
    if (handle) await handle.close().catch(() => {});
  }
}

// Every session registered in <claudeHome>/sessions, in no order. Claude Code
// writes one file per live process there, and each names its cwd, its session
// id and when it last changed. An unreadable registry answers []: it is one
// link signal among several, and its absence must not fail the join.
async function listRegisteredSessions(claudeHome) {
  if (typeof claudeHome !== 'string' || claudeHome === '') return [];
  const dir = path.join(claudeHome, 'sessions');

  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return []; // no registry on this Claude Code version
  }

  const records = await Promise.all(
    entries.filter((name) => name.endsWith('.json')).map(async (name) => {
      try {
        const record = JSON.parse(await fs.readFile(path.join(dir, name), 'utf8'));
        return record && typeof record === 'object' ? record : null;
      } catch {
        return null; // half-written or unreadable: not a candidate
      }
    })
  );
  return records.filter(Boolean);
}

// The transcript named by the newest session registration for the tab's cwd, or
// null. Only a file already in `candidates` is accepted: a pin to a file that
// never appears reads no events at all, which is the failure being fixed here.
async function registryTranscript(tab, claudeHome, dir, candidates) {
  const projectPath = tab?.projectPath;
  if (typeof projectPath !== 'string' || projectPath === '') return null;

  const registered = (await listRegisteredSessions(claudeHome))
    .filter((r) => r.cwd === projectPath && typeof r.sessionId === 'string' && r.sessionId !== '')
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  if (registered.length === 0) return null;

  const known = new Set(candidates.map((c) => c.fullPath));
  for (const record of registered) {
    const fullPath = path.join(dir, `${record.sessionId}.jsonl`);
    if (known.has(fullPath)) return fullPath;
  }
  return null;
}

// Transcripts in a project directory, newest first.
async function listTranscripts(projectDir) {
  const entries = await fs.readdir(projectDir, { withFileTypes: true });
  const stats = await Promise.all(
    entries
      .filter((e) => e.isFile() && e.name.endsWith('.jsonl'))
      .map(async (e) => {
        const fullPath = path.join(projectDir, e.name);
        try {
          return { fullPath, mtimeMs: (await fs.stat(fullPath)).mtimeMs };
        } catch {
          return null; // vanished between readdir and stat
        }
      })
  );
  return stats.filter(Boolean).sort((a, b) => b.mtimeMs - a.mtimeMs);
}

// The transcript file that belongs to this tab, or null when no file clearly
// does. `projectDir` overrides the derived directory; without it the directory
// comes from the tab's own project path.
// `tab` is a Tab from listAgentTabs (it carries `projectPath` and
// `cleanTitle`), or an orcaTarget (it carries `projectPath` and `title`), NOT a
// raw Orca terminal record (which carries `worktreePath` instead).
export async function resolveTranscript(tab, { claudeHome, projectDir } = {}) {
  let dir = projectDir;
  if (!dir) {
    const projectPath = tab?.projectPath;
    if (typeof projectPath !== 'string' || projectPath === '') return null;
    dir = projectDirFor(projectPath, claudeHome);
  }

  let candidates;
  try {
    candidates = await listTranscripts(dir);
  } catch {
    return null; // directory missing or unreadable
  }
  if (candidates.length === 0) return null;

  // The exact link first: this tab's own title inside a transcript. Claude Code
  // 2.1.302 opens a transcript with a metadata record that carries no cwd, so
  // the probe below links nothing on a modern file.
  // A Tab carries `cleanTitle`, but the reader re-pins with an orcaTarget,
  // which carries `title` (already clean). Strip the glyph either way: a lost
  // title link lets the registry pick another tab's transcript.
  const title = typeof tab?.cleanTitle === 'string' && tab.cleanTitle !== ''
    ? tab.cleanTitle
    : stripTitleGlyph(tab?.title);
  const registered = await registryTranscript(tab, claudeHome, dir, candidates);

  if (title) {
    // One tail read usually settles it: the registered file is normally this
    // tab's own.
    if (registered && (await readLastAiTitle(registered)) === title) return registered;
    for (const candidate of candidates) {
      if (candidate.fullPath === registered) continue; // already known to differ
      if ((await readLastAiTitle(candidate.fullPath)) === title) return candidate.fullPath;
    }
  }

  // The tab's own cwd wins, whatever the mtimes say: two Claude sessions in one
  // project dir are common, and the newest file is often the other one.
  for (const candidate of candidates) {
    const record = await readFirstRecord(candidate.fullPath);
    if (record && record.cwd === tab.projectPath) return candidate.fullPath; // cwd probe only
  }

  // No title and no cwd matched. The newest session registered for this cwd is
  // still this tab's far more often than not.
  if (registered) return registered;

  // No file claims this cwd. A lone file is still a safe answer; with several,
  // any pick could be another tab's session, and a wrong file is worse than no
  // file at all.
  return candidates.length === 1 ? candidates[0].fullPath : null;
}
