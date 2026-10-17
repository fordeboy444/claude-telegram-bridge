// Tests for the Orca agent-tab reader. listAgentTabs gets a fake client, so no
// socket opens and no Orca is needed. The transcript tests write real temp
// directories and real .jsonl files: the resolver reads the real filesystem,
// and a mocked fs would hide its read and parse errors.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  stripTitleGlyph, repoIdFromWorktreeId, listAgentTabs, resolveTranscript, projectDirFor
} from '../src/orca/terminals.js';
import { getProjectSlug } from '../src/tmux/session_reader.js';
import { OrcaRpcError } from '../src/orca/runtime_client.js';

const fakeClient = (terminals, statuses = {}) => ({
  list: async () => terminals,
  agentStatus: async (h) => statuses[h] ?? { isRunningAgent: false, status: null }
});

const tab = (over = {}) => ({
  handle: 'term_aaaa', title: '✳ Casual greeting',
  worktreePath: '/home/orca/Projects/Main Agent',
  worktreeId: '6147efad-94f3-49b1-87c4-fba5b98d01a0::/home/orca/Projects/Main Agent',
  connected: true, writable: true, lastOutputAt: 1, ...over
});

async function tempHome() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'orca-terminals-'));
}

// A Tab exactly as the real producer builds it: resolveTranscript takes a Tab,
// not a raw Orca record, so the tests take one from listAgentTabs itself.
async function agentTab() {
  const [t] = await listAgentTabs(
    fakeClient([tab()], { term_aaaa: { isRunningAgent: true, status: 'idle' } })
  );
  return t;
}

// Write one transcript. `records` keep their order, so records[0] is the first
// line the cwd probe reads.
async function writeTranscript(projectDir, name, records, mtimeMs) {
  const fullPath = path.join(projectDir, name);
  await fs.writeFile(fullPath, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  if (mtimeMs !== undefined) {
    await fs.utimes(fullPath, new Date(mtimeMs), new Date(mtimeMs));
  }
  return fullPath;
}

test('stripTitleGlyph drops the leading state glyph', () => {
  assert.equal(stripTitleGlyph('✳ Casual greeting'), 'Casual greeting');
  assert.equal(stripTitleGlyph('◐ Agents and subagents high effort'), 'Agents and subagents high effort');
  assert.equal(stripTitleGlyph('◑ working'), 'working');
  assert.equal(stripTitleGlyph('Claude Code'), 'Claude Code');
});

test('repoIdFromWorktreeId splits on the double colon', () => {
  assert.equal(
    repoIdFromWorktreeId('6147efad-94f3-49b1-87c4-fba5b98d01a0::/home/orca/Projects/Main Agent'),
    '6147efad-94f3-49b1-87c4-fba5b98d01a0'
  );
  assert.equal(repoIdFromWorktreeId(undefined), null);
  assert.equal(repoIdFromWorktreeId('/plain/path'), null); // no '::' -> null
});

test('listAgentTabs keeps agent tabs and drops shell tabs', async () => {
  const client = fakeClient(
    [
      tab({ handle: 'term_shell', title: '◑ bash', worktreePath: null, worktreeId: null }),
      tab({ handle: 'term_agent' })
    ],
    { term_agent: { isRunningAgent: true, status: 'idle' } }
  );

  const tabs = await listAgentTabs(client);

  assert.deepEqual(tabs.map((t) => t.handle), ['term_agent']);
  assert.equal(tabs[0].cleanTitle, 'Casual greeting');
  assert.equal(tabs[0].projectPath, '/home/orca/Projects/Main Agent');
  assert.equal(tabs[0].status, 'idle');
  assert.equal(tabs[0].repoId, '6147efad-94f3-49b1-87c4-fba5b98d01a0');
});

test('listAgentTabs drops a disconnected tab even when it runs an agent', async () => {
  const probed = [];
  const client = {
    list: async () => [tab({ handle: 'term_gone', connected: false })],
    agentStatus: async (h) => {
      probed.push(h);
      return { isRunningAgent: true, status: 'working' };
    }
  };

  assert.deepEqual(await listAgentTabs(client), []);
  // A disconnected tab is skipped before the status probe: it costs one RPC
  // each, and its answer cannot make the tab usable.
  assert.deepEqual(probed, []);
});

test('listAgentTabs skips a tab whose agentStatus probe throws', async () => {
  const h2Path = '/home/orca/Projects/Other Agent';
  const client = {
    list: async () => [
      tab({ handle: 'h1' }),
      tab({ handle: 'h2', worktreePath: h2Path, worktreeId: `repo-two::${h2Path}` })
    ],
    agentStatus: async (h) => {
      if (h === 'h1') {
        throw new OrcaRpcError('Orca did not answer terminal.agentStatus', { code: 'timeout' });
      }
      return { isRunningAgent: true, status: 'working' };
    }
  };

  const result = await listAgentTabs(client);

  // One dead tab must not empty the picker: the good tab still shows.
  assert.equal(result.length, 1);
  assert.equal(result[0].handle, 'h2');
  assert.equal(result[0].projectPath, h2Path);
});

test('listAgentTabs lets a list() failure reach the caller', async () => {
  const brokenClient = {
    list: async () => {
      throw new OrcaRpcError('Cannot read the Orca runtime file', { code: 'runtime_unavailable' });
    },
    agentStatus: async () => ({ isRunningAgent: true, status: 'working' })
  };

  // A stale socket or a missing runtime json is the caller's message to send,
  // so it must not be swallowed here.
  await assert.rejects(() => listAgentTabs(brokenClient));
});

test('projectDirFor slugifies the path the way Claude Code does', () => {
  // getProjectSlug resolves with the native path module, so a POSIX path only
  // slugs to the real Claude project name on the Linux bridge. Same guard as
  // test/session_reader.test.js.
  if (process.platform !== 'win32') {
    assert.ok(projectDirFor('/home/orca/Projects/Main Agent', '/home/orca/.claude')
      .endsWith(path.join('projects', '-home-orca-Projects-Main-Agent')));
  }

  // Platform-independent half: the directory is <claudeHome>/projects/<slug>,
  // and the slug comes from the shared slugger, not a second copy of it.
  assert.equal(
    projectDirFor('/home/orca/Projects/Main Agent', '/home/orca/.claude'),
    path.join('/home/orca/.claude', 'projects', getProjectSlug('/home/orca/Projects/Main Agent'))
  );
});

test('resolveTranscript prefers the file whose first record cwd matches the tab', async () => {
  const claudeHome = await tempHome();
  const projectDir = path.join(claudeHome, 'projects', 'some-slug');
  await fs.mkdir(projectDir, { recursive: true });

  await writeTranscript(projectDir, 'old.jsonl', [{ cwd: '/home/orca/Projects/Main Agent' }], 1000);
  await writeTranscript(projectDir, 'new.jsonl', [{ cwd: '/home/orca/Projects/Other' }], 2000);

  const t = await agentTab();
  const resolved = await resolveTranscript(t, { claudeHome, projectDir });

  assert.ok(resolved.endsWith('old.jsonl'));
});

test('resolveTranscript falls back to newest mtime when no cwd matches', async () => {
  const claudeHome = await tempHome();
  const projectDir = path.join(claudeHome, 'projects', 'some-slug');
  await fs.mkdir(projectDir, { recursive: true });

  // The only transcript in the project: nothing to confuse it with, so the
  // fallback answer is safe even though its first record names another cwd.
  await writeTranscript(projectDir, 'only.jsonl', [{ cwd: '/somewhere/else' }], 1000);

  const resolved = await resolveTranscript(await agentTab(), { claudeHome, projectDir });

  assert.ok(resolved.endsWith('only.jsonl'));
});

test('resolveTranscript returns null when several files match no cwd', async () => {
  const claudeHome = await tempHome();
  const projectDir = path.join(claudeHome, 'projects', 'some-slug');
  await fs.mkdir(projectDir, { recursive: true });

  // Two candidates, neither claims the tab. A wrong file is worse than no file.
  await writeTranscript(projectDir, 'a.jsonl', [{ cwd: '/home/orca/Projects/Other' }], 1000);
  await writeTranscript(projectDir, 'b.jsonl', [{ cwd: '/home/orca/Projects/Third' }], 2000);

  assert.equal(await resolveTranscript(await agentTab(), { claudeHome, projectDir }), null);
});

test('resolveTranscript skips a file whose first record is not JSON', async () => {
  const claudeHome = await tempHome();
  const projectDir = path.join(claudeHome, 'projects', 'some-slug');
  await fs.mkdir(projectDir, { recursive: true });

  await writeTranscript(projectDir, 'newest.jsonl', [{ cwd: '/home/orca/Projects/Main Agent' }], 1000);
  // Newest file, but its first line is truncated or not JSON: it must not throw
  // and must not shadow the good candidate.
  await fs.writeFile(path.join(projectDir, 'broken.jsonl'), 'not json at all\n');
  await fs.utimes(
    path.join(projectDir, 'broken.jsonl'),
    new Date(2000),
    new Date(2000)
  );

  const resolved = await resolveTranscript(await agentTab(), { claudeHome, projectDir });
  assert.ok(resolved.endsWith('newest.jsonl'));
});

test('resolveTranscript returns null for a project dir with no jsonl', async () => {
  const claudeHome = await tempHome();
  const projectDir = path.join(claudeHome, 'projects', 'some-slug');
  await fs.mkdir(projectDir, { recursive: true });
  await fs.writeFile(path.join(projectDir, 'notes.txt'), 'not a transcript\n');

  assert.equal(await resolveTranscript(await agentTab(), { claudeHome, projectDir }), null);
});

test('resolveTranscript derives the project dir from the tab when none is given', async () => {
  const claudeHome = await tempHome();
  const t = await agentTab();
  const projectDir = projectDirFor(t.projectPath, claudeHome);
  await fs.mkdir(projectDir, { recursive: true });
  await writeTranscript(projectDir, 'sess.jsonl', [{ cwd: t.projectPath }]);

  assert.ok((await resolveTranscript(t, { claudeHome })).endsWith('sess.jsonl'));
});

// --- Linking a tab to its transcript on Claude Code 2.1.302 ---
//
// 2.1.302 opens a transcript with a metadata record (type "mode",
// "last-prompt"), and that record carries no cwd. The first-record probe below
// therefore links nothing on a modern transcript, and several transcripts in
// one project dir defeat the lone-file rule. Two other signals link a tab:
// the session registry, and the ai-title record Claude writes into its own
// transcript (it equals the Orca tab title).

// A Claude session registry entry: <claudeHome>/sessions/<pid>.json.
async function writeRegistryEntry(claudeHome, pid, record) {
  const sessionsDir = path.join(claudeHome, 'sessions');
  await fs.mkdir(sessionsDir, { recursive: true });
  await fs.writeFile(path.join(sessionsDir, `${pid}.json`), JSON.stringify(record));
}

test('resolveTranscript uses the session registry when no first record carries a cwd', async () => {
  const claudeHome = await tempHome();
  const projectDir = path.join(claudeHome, 'projects', 'some-slug');
  await fs.mkdir(projectDir, { recursive: true });
  const t = await agentTab();

  const mine = await writeTranscript(projectDir, 'aaaa.jsonl', [{ type: 'mode' }], 1000);
  await writeTranscript(projectDir, 'bbbb.jsonl', [{ type: 'mode' }], 2000);
  await writeRegistryEntry(claudeHome, 105877, {
    sessionId: 'aaaa', cwd: t.projectPath, updatedAt: 100
  });

  assert.equal(await resolveTranscript(t, { claudeHome, projectDir }), mine);
});

test('resolveTranscript takes the newest registry entry for the tab cwd', async () => {
  const claudeHome = await tempHome();
  const projectDir = path.join(claudeHome, 'projects', 'some-slug');
  await fs.mkdir(projectDir, { recursive: true });
  const t = await agentTab();

  // The registered session is the OLDER file, so this also proves the registry
  // beats mtime: a wrong file is worse than no file.
  await writeTranscript(projectDir, 'old.jsonl', [{ type: 'mode' }], 2000);
  const mine = await writeTranscript(projectDir, 'new.jsonl', [{ type: 'mode' }], 1000);

  await writeRegistryEntry(claudeHome, 111, { sessionId: 'old', cwd: t.projectPath, updatedAt: 100 });
  await writeRegistryEntry(claudeHome, 222, { sessionId: 'new', cwd: t.projectPath, updatedAt: 200 });
  // One session resumed in a second process registers twice; the older
  // registration must lose.
  await writeRegistryEntry(claudeHome, 333, { sessionId: 'new', cwd: t.projectPath, updatedAt: 50 });

  assert.equal(await resolveTranscript(t, { claudeHome, projectDir }), mine);
});

test('resolveTranscript ignores registry entries for another cwd', async () => {
  const claudeHome = await tempHome();
  const projectDir = path.join(claudeHome, 'projects', 'some-slug');
  await fs.mkdir(projectDir, { recursive: true });
  const t = await agentTab();

  await writeTranscript(projectDir, 'mine.jsonl', [{ type: 'mode' }], 1000);
  // Newest file, and the only registration: both point away from the tab.
  await writeTranscript(projectDir, 'other.jsonl', [{ type: 'mode' }], 2000);
  await writeRegistryEntry(claudeHome, 111, {
    sessionId: 'other', cwd: '/home/orca/Projects/Other', updatedAt: 999
  });

  assert.equal(await resolveTranscript(t, { claudeHome, projectDir }), null);
});

test('resolveTranscript does not pin a registered session file that is gone', async () => {
  const claudeHome = await tempHome();
  const projectDir = path.join(claudeHome, 'projects', 'some-slug');
  await fs.mkdir(projectDir, { recursive: true });
  const t = await agentTab();

  const only = await writeTranscript(projectDir, 'only.jsonl', [{ type: 'mode' }], 1000);
  // A stale registration for this cwd whose transcript no longer exists. A pin
  // to a file that never appears spins forever, which is the bug being fixed.
  await writeRegistryEntry(claudeHome, 111, {
    sessionId: 'gone', cwd: t.projectPath, updatedAt: 999
  });

  assert.equal(await resolveTranscript(t, { claudeHome, projectDir }), only);
});

test('resolveTranscript prefers the transcript whose last ai-title matches the tab', async () => {
  const claudeHome = await tempHome();
  const projectDir = path.join(claudeHome, 'projects', 'some-slug');
  await fs.mkdir(projectDir, { recursive: true });
  const t = await agentTab(); // cleanTitle: 'Casual greeting'

  // The tab's own transcript is the OLDER file.
  const mine = await writeTranscript(projectDir, 'mine.jsonl', [
    { type: 'mode' },
    { type: 'ai-title', aiTitle: 'An old title' },
    { type: 'ai-title', aiTitle: 'Casual greeting' }
  ], 1000);
  await writeTranscript(projectDir, 'other.jsonl', [
    { type: 'mode' },
    { type: 'ai-title', aiTitle: 'Something else' }
  ], 2000);

  assert.equal(await resolveTranscript(t, { claudeHome, projectDir }), mine);
});

test('resolveTranscript matches the ai-title on an orca target record', async () => {
  const claudeHome = await tempHome();
  const projectDir = path.join(claudeHome, 'projects', 'some-slug');
  await fs.mkdir(projectDir, { recursive: true });
  const t = await agentTab();

  // The reader re-pins with an orcaTarget, which carries `title`, not
  // `cleanTitle`. Without the fallback the title link is lost, and the registry
  // answers with the OTHER tab's transcript.
  const target = {
    kind: 'orca', handle: t.handle, title: t.cleanTitle,
    projectPath: t.projectPath, transcriptFile: null
  };

  const mine = await writeTranscript(projectDir, 'mine.jsonl', [
    { type: 'mode' },
    { type: 'ai-title', aiTitle: 'Casual greeting' }
  ], 1000);
  await writeTranscript(projectDir, 'other.jsonl', [
    { type: 'mode' },
    { type: 'ai-title', aiTitle: 'Something else' }
  ], 2000);
  await writeRegistryEntry(claudeHome, 222, {
    sessionId: 'other', cwd: t.projectPath, updatedAt: 999
  });

  assert.equal(await resolveTranscript(target, { claudeHome, projectDir }), mine);
});

test('resolveTranscript prefers an ai-title match over the registry', async () => {
  const claudeHome = await tempHome();
  const projectDir = path.join(claudeHome, 'projects', 'some-slug');
  await fs.mkdir(projectDir, { recursive: true });
  const t = await agentTab();

  // Two tabs share one project dir. The registry holds the newest session in
  // that cwd, which is the OTHER tab, so the exact title must win.
  const mine = await writeTranscript(projectDir, 'mine.jsonl', [
    { type: 'mode' },
    { type: 'ai-title', aiTitle: 'Casual greeting' }
  ], 1000);
  await writeTranscript(projectDir, 'other.jsonl', [
    { type: 'mode' },
    { type: 'ai-title', aiTitle: 'Something else' }
  ], 2000);
  await writeRegistryEntry(claudeHome, 222, {
    sessionId: 'other', cwd: t.projectPath, updatedAt: 999
  });

  assert.equal(await resolveTranscript(t, { claudeHome, projectDir }), mine);
});
