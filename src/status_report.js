// claude-telegram-bridge/src/status_report.js
// /status dashboard data: session uptime, current model, and side-chain
// sub-agent records. Reads Claude transcripts directly; never throws for
// missing files (the caller gets null/empty fields and renders what exists).
import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveClaudeProjectDir, findLatestJsonlFile } from './tmux/session_reader.js';

// An agent transcript can be many MB; the whole file is parsed once per poll.
export const MAX_LISTED_AGENTS = 10;
// Only the tail of the main transcript is scanned for the current model:
// transcripts can be many MB, and the first record already gives the start.
export const TAIL_BYTES = 262_144;
// Valid /effort levels, mirroring the builtin choices in src/skills/scanner.js.
export const EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'];
// Terminal stop reasons: the assistant ended the turn and waits for the user.
const TURN_END_REASONS = new Set(['end_turn', 'max_tokens', 'stop_sequence', 'refusal']);
const INTERRUPT_MARKER = /^\s*\[Request interrupted by user/;
export const DESC_MAX = 48;
// Character budget before the agent list gets shortened (Telegram cap 4096).
const MAX_MESSAGE_CHARS = 3800;

async function readFirstLineTimestamp(filePath) {
  try {
    const handle = await fs.open(filePath, 'r');
    try {
      const { buffer } = await handle.read(Buffer.alloc(8192), 0, 8192, 0);
      const firstLine = buffer.toString('utf8').split('\n')[0];
      const record = JSON.parse(firstLine);
      if (!record || typeof record.timestamp !== 'string') return null;
      const ts = Date.parse(record.timestamp);
      return Number.isNaN(ts) ? null : ts;
    } finally {
      await handle.close();
    }
  } catch {
    return null;
  }
}

// First assistant `message.model` scanning the last TAIL_BYTES from the end:
// the gateway can remap models, so the last record is the current truth.
async function readTailModel(filePath) {
  try {
    const stat = await fs.stat(filePath);
    const start = Math.max(0, stat.size - TAIL_BYTES);
    const length = stat.size - start;
    const handle = await fs.open(filePath, 'r');
    let model = null;
    try {
      const { buffer } = await handle.read(Buffer.alloc(length), 0, length, start);
      const lines = buffer.toString('utf8').split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        if (!lines[i].trim()) continue;
        try {
          const record = JSON.parse(lines[i]);
          if (record.type === 'assistant' && record.message && record.message.model) {
            model = record.message.model;
            break;
          }
        } catch {
          // A line cut at the chunk start fails to parse; keep scanning
        }
      }
    } finally {
      await handle.close();
    }
    return model;
  } catch {
    return null;
  }
}

// The current effort is the newest effort signal in the tail — same tail
// logic as readTailModel. The primary source is the top-level `effort` field
// that Claude Code writes on each assistant record. That field is the only
// place the value lands when /effort runs as a picker: the picker leaves
// <command-args> empty, so a prompt-shape scan alone never finds a level.
// The command-marker and plain-prompt shapes stay as a fallback for records
// written before the `effort` field existed. Only a whitelisted EFFORT_LEVELS
// value is accepted; anything else is ignored and the backwards scan
// continues, so no match yields null.
function extractEffortCandidate(text) {
  const markerName = text.match(/<command-name>\s*\/effort\s*<\/command-name>/i);
  if (markerName) {
    const args = text.match(/<command-args>([^<]*)<\/command-args>/);
    return args ? args[1] : '';
  }
  const prompt = text.match(/(?:^|\n)\/effort[ \t]+(\S+)/);
  return prompt ? prompt[1] : null;
}

// Read the effort of one transcript record. Returns a whitelisted level or
// null. The top-level `effort` field wins; the prompt shapes are the fallback.
function readRecordEffort(record) {
  if (record && typeof record.effort === 'string') {
    const level = record.effort.trim().toLowerCase();
    if (EFFORT_LEVELS.includes(level)) return level;
  }
  if (!record || record.type !== 'user' || !record.message || !record.message.content) return null;
  let text;
  if (typeof record.message.content === 'string') {
    text = record.message.content;
  } else if (Array.isArray(record.message.content)) {
    text = record.message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');
  } else {
    return null;
  }
  const candidate = extractEffortCandidate(text);
  if (candidate === null) return null;
  const level = String(candidate).trim().toLowerCase();
  return EFFORT_LEVELS.includes(level) ? level : null;
}

async function readTailEffort(filePath) {
  try {
    const stat = await fs.stat(filePath);
    const start = Math.max(0, stat.size - TAIL_BYTES);
    const length = stat.size - start;
    const handle = await fs.open(filePath, 'r');
    try {
      const { buffer } = await handle.read(Buffer.alloc(length), 0, length, start);
      const lines = buffer.toString('utf8').split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        if (!lines[i].trim()) continue;
        let record;
        try {
          record = JSON.parse(lines[i]);
        } catch {
          // A line cut at the chunk start fails to parse; keep scanning
          continue;
        }
        const level = readRecordEffort(record);
        if (level) return level;
      }
    } finally {
      await handle.close();
    }
    return null;
  } catch {
    return null;
  }
}

// Text of one user record, for the interrupt marker only.
function readUserText(record) {
  if (!record || !record.message || !record.message.content) return '';
  const content = record.message.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  }
  return '';
}

// The newest turn-bearing record decides the card state:
// - a terminal stop_reason ends the turn -> stopped
// - an interrupt record ends the turn -> stopped
// - a real user prompt opens a turn -> running
// - any other assistant record (tool_use, null) keeps the turn open -> running
// Command, meta and caveat user records do not change the state: skip them
// and keep the backwards scan. No turn-bearing record -> stopped.
async function readTailState(filePath) {
  try {
    const stat = await fs.stat(filePath);
    const start = Math.max(0, stat.size - TAIL_BYTES);
    const length = stat.size - start;
    const handle = await fs.open(filePath, 'r');
    try {
      const { buffer } = await handle.read(Buffer.alloc(length), 0, length, start);
      const lines = buffer.toString('utf8').split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        if (!lines[i].trim()) continue;
        let record;
        try {
          record = JSON.parse(lines[i]);
        } catch {
          // A line cut at the chunk start fails to parse; keep scanning
          continue;
        }
        if (record.type === 'assistant' && record.message) {
          return TURN_END_REASONS.has(record.message.stop_reason) ? 'stopped' : 'running';
        }
        if (record.type === 'user') {
          const text = readUserText(record);
          if (INTERRUPT_MARKER.test(text)) return 'stopped';
          if (record.isMeta || text.includes('<command-name>') || text.includes('<local-command-caveat>')) {
            continue;
          }
          return 'running';
        }
      }
    } finally {
      await handle.close();
    }
    return 'stopped';
  } catch {
    return 'stopped';
  }
}

// Parse one side-chain transcript: start, last activity, input+output token
// sums over assistant records, the last assistant model, and its effort.
async function parseAgentTranscript(filePath) {
  let content;
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }

  let startMs = null;
  let lastMs = null;
  let inputTokens = 0;
  let outputTokens = 0;
  let model = null;
  let effort = null;
  let lastAssistantStop = null;
  let sawAssistant = false;

  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue; // ignore malformed lines
    }
    if (typeof record.timestamp === 'string') {
      const ts = Date.parse(record.timestamp);
      if (!Number.isNaN(ts)) {
        if (startMs === null) startMs = ts;
        lastMs = ts;
      }
    }
    if (record.type === 'assistant' && record.message) {
      sawAssistant = true;
      lastAssistantStop = record.message.stop_reason ?? null;
      const usage = record.message.usage;
      if (usage) {
        inputTokens += Number(usage.input_tokens) || 0;
        outputTokens += Number(usage.output_tokens) || 0;
      }
      if (record.message.model) {
        model = record.message.model;
      }
      const level = readRecordEffort(record);
      if (level) effort = level;
    }
  }

  // Side-chain transcripts have no result record. The last assistant
  // stop_reason is the portable completion marker: a terminal reason ends the
  // agent, anything else (tool_use, null) keeps it working. An agent with no
  // assistant record yet has just started and still runs.
  const finished = sawAssistant && TURN_END_REASONS.has(lastAssistantStop);

  return { startMs, lastMs, inputTokens, outputTokens, model, effort, finished };
}

function agentIdFromFileName(fileName) {
  return fileName.replace(/^agent-/, '').replace(/\.jsonl$/, '');
}

// Side-chain records: the last assistant stop_reason decides running versus
// finished. There is no time limit: a sub-agent that works for hours stays
// running until its transcript shows a terminal stop_reason.
async function gatherSubAgents(projectDir, effectiveId) {
  const agentsDir = path.join(projectDir, effectiveId, 'subagents');
  const running = [];
  let finishedCount = 0;

  let files;
  try {
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    files = entries
      .filter(e => e.isFile() && /^agent-.*\.jsonl$/.test(e.name))
      .map(e => e.name);
  } catch {
    return { running, finishedCount, totalCount: 0 }; // no sub-agents dir
  }

  for (const fileName of files) {
    const filePath = path.join(agentsDir, fileName);
    try {
      const parsed = await parseAgentTranscript(filePath);
      if (!parsed) {
        finishedCount++;
        continue;
      }
      const { finished, ...agent } = parsed;
      if (finished) {
        finishedCount++;
        continue;
      }
      running.push({ agentId: agentIdFromFileName(fileName), ...agent });
    } catch {
      finishedCount++;
    }
  }

  // Oldest start first, so the longest-running agent is at the top.
  running.sort((a, b) => (a.startMs ?? Infinity) - (b.startMs ?? Infinity));

  // Labels come from <agentsDir>/agent-<id>.meta.json; a missing file falls
  // back to agentType, then to the file-name id.
  for (const agent of running) {
    let label = null;
    let agentType = null;
    try {
      const meta = JSON.parse(
        await fs.readFile(path.join(agentsDir, `agent-${agent.agentId}.meta.json`), 'utf8')
      );
      agentType = meta.agentType || null;
      label = meta.description || agentType || agent.agentId;
    } catch {
      label = agent.agentId;
    }
    agent.label = label;
    agent.agentType = agentType;
  }

  return {
    running,
    finishedCount,
    totalCount: running.length + finishedCount
  };
}

export async function gatherSessionStatus({ claudeHome, projectPath, sessionId, now = Date.now() }) {
  const empty = {
    transcriptFound: false,
    state: 'stopped', // no transcript means Claude waits at the prompt
    sessionStart: null,
    model: null,
    effort: null,
    lastActivityMs: null,
    running: [],
    finishedCount: 0,
    totalCount: 0
  };

  let projectDir;
  try {
    projectDir = await resolveClaudeProjectDir(claudeHome, projectPath);
  } catch {
    projectDir = null;
  }
  if (!projectDir) return empty;

  // Bound id wins; no id falls back to the newest transcript (legacy sessions).
  let transcriptPath = null;
  let effectiveId = null;
  if (sessionId) {
    transcriptPath = path.join(projectDir, `${sessionId}.jsonl`);
    effectiveId = sessionId;
  } else {
    transcriptPath = await findLatestJsonlFile(projectDir).catch(() => null);
    if (!transcriptPath) return empty;
    effectiveId = path.basename(transcriptPath).replace(/\.jsonl$/, '');
  }

  let stat = null;
  try {
    stat = await fs.stat(transcriptPath);
  } catch {
    // The bound file may not exist yet, but side-chain records can still exist
    const sub = await gatherSubAgents(projectDir, effectiveId).catch(
      () => ({ running: [], finishedCount: 0, totalCount: 0 })
    );
    // A running sub-agent means work continues even with no main transcript.
    const state = sub.running.length > 0 ? 'running' : 'stopped';
    return { ...empty, state, running: sub.running, finishedCount: sub.finishedCount, totalCount: sub.totalCount };
  }

  const [sessionStart, model, effort, tailState, sub] = await Promise.all([
    readFirstLineTimestamp(transcriptPath),
    readTailModel(transcriptPath),
    readTailEffort(transcriptPath),
    readTailState(transcriptPath),
    gatherSubAgents(projectDir, effectiveId).catch(
      () => ({ running: [], finishedCount: 0, totalCount: 0 })
    )
  ]);

  // The main turn can wait while a sub-agent still works: report running.
  const state = sub.running.length > 0 ? 'running' : tailState;

  return {
    transcriptFound: true,
    state,
    sessionStart,
    model,
    effort,
    lastActivityMs: stat.mtimeMs,
    running: sub.running,
    finishedCount: sub.finishedCount,
    totalCount: sub.totalCount
  };
}

// --- Formatting helpers (STE-clean, Telegram Markdown) ---

export function formatCompactNumber(n) {
  if (!Number.isFinite(n) || n < 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function formatAge(ms, now) {
  if (!Number.isFinite(ms)) return 'unknown';
  return `${formatDuration(Math.max(0, now - ms))} ago`;
}

// Dynamic text goes into Markdown; strip the formatting characters and
// line breaks so a label can never break the message.
export function sanitizeLabel(text, maxLength = DESC_MAX) {
  if (typeof text !== 'string') return '';
  const cleaned = text.replace(/[`_*[\]~]/g, '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1)}…`;
}

function formatAgentLine(agent, index, now) {
  const typePart = agent.agentType && agent.label !== agent.agentType
    ? `[${sanitizeLabel(agent.agentType, 24)}] `
    : '';
  const label = sanitizeLabel(agent.label);
  const model = agent.model ? sanitizeLabel(agent.model, 40) : 'unknown';
  const effortPart = agent.effort ? `effort ${sanitizeLabel(agent.effort, 24)}` : 'no effort';
  const parts = [
    `⏳ ${formatDuration(now - agent.startMs)}`,
    model,
    effortPart,
    `active ${formatAge(agent.lastMs, now)}`
  ];
  return `${index}. ${typePart}${label}\n   ${parts.join(' · ')}`;
}

export function formatStatusMessage({ sessionName, alive, status, now = Date.now() }) {
  return fitMessage({ sessionName, alive, status, now });
}

// Keep under MAX_MESSAGE_CHARS: shorten labels first, then list fewer agents.
// The list is sorted oldest first, so shrinking the listing drops the
// shortest-running agents (they move into the "…and N more" count).
function fitMessage({ sessionName, alive, status, now }) {
  if (!status || !status.running) {
    return renderStatusLines({ sessionName, alive, status, now, labelMax: DESC_MAX, maxListed: MAX_LISTED_AGENTS });
  }

  let labelMax = DESC_MAX;
  let maxListed = Math.min(MAX_LISTED_AGENTS, status.running.length);
  let message = renderStatusLines({ sessionName, alive, status, now, labelMax, maxListed });

  if (message.length > MAX_MESSAGE_CHARS) {
    labelMax = Math.floor(DESC_MAX / 2);
    message = renderStatusLines({ sessionName, alive, status, now, labelMax, maxListed });
  }

  // Drop the newest half of the list each pass until it fits; the header
  // must stay even when nothing is listed anymore.
  while (message.length > MAX_MESSAGE_CHARS && maxListed > 1) {
    maxListed = Math.max(1, Math.floor(maxListed / 2));
    message = renderStatusLines({ sessionName, alive, status, now, labelMax, maxListed });
  }
  if (message.length > MAX_MESSAGE_CHARS && maxListed === 1) {
    message = renderStatusLines({ sessionName, alive, status, now, labelMax, maxListed: 0 });
  }
  return message;
}

function renderStatusLines({ sessionName, alive, status, now, labelMax, maxListed }) {
  const lines = ['📊 *Session Status*'];

  // A dead session is terminated. A live one is running during a turn and
  // stopped while Claude waits for the user.
  let stateMark = '🔴 Terminated';
  if (alive) {
    stateMark = status && status.state === 'running' ? '🟢 Running' : '🟡 Stopped';
  }
  // Display name only: sessions are named claude-<folder>; show the folder part.
  const displayName = sessionName ? sessionName.replace(/^claude-/, '') : '';
  const name = sanitizeLabel(displayName || 'unknown');
  lines.push(`🎯 \`${name}\` ${stateMark}`);

  // A live session with no transcript on disk is a cold start, not a lookup
  // failure: Claude writes the transcript on the first exchange. Say so
  // instead of silently hiding every data line below. Never shown when the
  // session is terminated (nothing to message).
  if (alive && status && status.transcriptFound === false) {
    lines.push('ℹ️ No transcript yet — send the session a message to start it');
  }

  if (status && status.model) {
    lines.push(`🤖 Model: \`${sanitizeLabel(status.model, 48)}\``);
  }

  // Hidden until an /effort level exists in the transcript tail.
  if (status && status.effort) {
    lines.push(`🧠 Effort: \`${sanitizeLabel(status.effort, 24)}\``);
  }

  const timeParts = [];
  if (status && status.sessionStart) {
    timeParts.push(`Uptime: ${formatDuration(Math.max(0, now - status.sessionStart))}`);
  }
  if (status && status.lastActivityMs) {
    timeParts.push(`Last activity: ${formatAge(status.lastActivityMs, now)}`);
  }
  if (timeParts.length) {
    lines.push(`⏱ ${timeParts.join(' · ')}`);
  }

  if (status && status.totalCount > 0) {
    const listed = status.running.slice(0, maxListed);
    lines.push('', `🤝 *Sub-agents:* ${status.running.length} running · ${status.finishedCount} finished`);
    for (let i = 0; i < listed.length; i++) {
      lines.push(formatAgentLine(listed[i], i + 1, now));
    }
    const hidden = status.running.length - listed.length;
    if (hidden > 0) {
      lines.push(`…and ${hidden} more`);
    }
  } else if (status) {
    lines.push('', '🤝 *Sub-agents:* none');
  }

  return lines.join('\n');
}