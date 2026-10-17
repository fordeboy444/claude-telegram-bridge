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
      console.warn('⚠️ Orca tab probe failed (' + handle + '):', err.message);
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
// `tab` is a Tab from listAgentTabs (it carries `projectPath`), NOT a raw Orca
// terminal record (which carries `worktreePath` instead).
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

  // The tab's own cwd wins, whatever the mtimes say: two Claude sessions in one
  // project dir are common, and the newest file is often the other one.
  for (const candidate of candidates) {
    const record = await readFirstRecord(candidate.fullPath);
    if (record && record.cwd === tab.projectPath) return candidate.fullPath; // cwd probe only
  }

  // No file claims this cwd. A lone file is still a safe answer; with several,
  // any pick could be another tab's session, and a wrong file is worse than no
  // file at all.
  return candidates.length === 1 ? candidates[0].fullPath : null;
}
