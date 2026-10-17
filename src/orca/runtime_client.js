// claude-telegram-bridge/src/orca/runtime_client.js
// Speaks newline-delimited JSON-RPC to Orca's local unix socket. Orca writes
// orca-runtime.json next to the socket; that file names the endpoint and
// carries the auth token. No policy lives here — the caller decides what to do
// with the answers.
import net from 'node:net';
import fs from 'node:fs/promises';

// The bridge mounts the orca-home volume at /home/orca, so it sees the socket
// and this file directly. The path contains the runtime pid: never glob *.sock.
export const DEFAULT_RUNTIME_JSON_PATH = '/home/orca/.config/orca/orca-runtime.json';

const DEFAULT_TIMEOUT_MS = 5000;

// Request ids come from a counter, never from a clock. Only uniqueness inside
// one process matters, and a counter keeps the tests independent of timing.
let rpcSeq = 0;

function nextRpcId() {
  return `r${++rpcSeq}`;
}

// Any failure to reach or satisfy Orca. `code` says which one:
//   runtime_unavailable — the runtime json is unreadable or incomplete
//   socket_error        — the socket refused, broke or closed early
//   timeout             — no matching reply in time
//   <error.code>        — Orca answered ok:false, for example unauthorized
export class OrcaRpcError extends Error {
  constructor(message, { method = null, code = 'rpc_error', cause } = {}) {
    super(message);
    this.name = 'OrcaRpcError';
    this.method = method;
    this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

// Read the current unix endpoint and token. Callers must call this again after
// any Orca restart: the socket name carries the new pid and the token rotates.
export async function readRuntimeTarget(runtimeJsonPath = DEFAULT_RUNTIME_JSON_PATH, fsMod = fs) {
  let body;
  try {
    body = JSON.parse(await fsMod.readFile(runtimeJsonPath, 'utf8'));
  } catch (cause) {
    throw new OrcaRpcError(`Cannot read the Orca runtime file ${runtimeJsonPath}`, {
      code: 'runtime_unavailable',
      cause
    });
  }

  const transports = Array.isArray(body?.transports) ? body.transports : [];
  const unix = transports.find(
    (t) => t && t.kind === 'unix' && typeof t.endpoint === 'string' && t.endpoint !== ''
  );
  if (!unix) {
    throw new OrcaRpcError(`No unix transport in ${runtimeJsonPath}`, { code: 'runtime_unavailable' });
  }

  // The token is a top-level body field. Without it Orca answers
  // unauthorized / Missing auth token.
  if (typeof body.authToken !== 'string' || body.authToken === '') {
    throw new OrcaRpcError(`No authToken in ${runtimeJsonPath}`, { code: 'runtime_unavailable' });
  }

  return { socketPath: unix.endpoint, authToken: body.authToken };
}

// One request, one fresh connection, one reply. Resolves with `result`.
export function rpcOnce({
  connect = (options) => net.connect(options),
  socketPath,
  authToken,
  id = nextRpcId(),
  method,
  params = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
}) {
  return new Promise((resolve, reject) => {
    let socket;
    try {
      socket = connect({ path: socketPath });
    } catch (cause) {
      reject(new OrcaRpcError(`Cannot open the Orca socket ${socketPath}`, {
        method,
        code: 'socket_error',
        cause
      }));
      return;
    }

    let settled = false;
    let buffer = '';
    let timer = null;

    const finish = (settle, value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      // destroy() runs BEFORE the listeners drop. A late 'error' with no listener
      // attached is unhandled and kills the daemon. The 'error' listener stays on
      // the socket for its remaining life; the `settled` guard above absorbs the
      // re-entry it produces.
      socket.destroy();
      socket.removeListener('data', onData);
      socket.removeListener('close', onClose);
      settle(value);
    };

    const onData = (chunk) => {
      buffer += chunk.toString('utf8');
      const parts = buffer.split('\n');
      buffer = parts.pop(); // the last part is an incomplete line
      for (const line of parts) {
        if (line.trim() === '') continue;
        let reply;
        try {
          reply = JSON.parse(line);
        } catch {
          continue; // not a complete JSON object: wait for more bytes
        }
        if (!reply || reply.id !== id) continue; // someone else's reply
        if (reply.ok === false) {
          const error = reply.error ?? {};
          finish(reject, new OrcaRpcError(error.message || `Orca refused ${method}`, {
            method,
            code: error.code || 'rpc_error'
          }));
          return;
        }
        finish(resolve, reply.result);
        return;
      }
    };
    const onError = (cause) => {
      finish(reject, new OrcaRpcError(`Orca socket error on ${method}`, {
        method,
        code: 'socket_error',
        cause
      }));
    };
    const onClose = () => {
      finish(reject, new OrcaRpcError(`Orca closed the socket before answering ${method}`, {
        method,
        code: 'socket_error'
      }));
    };

    socket.on('data', onData);
    socket.on('error', onError);
    socket.on('close', onClose);

    timer = setTimeout(() => {
      finish(reject, new OrcaRpcError(`Orca did not answer ${method}`, { method, code: 'timeout' }));
    }, timeoutMs);

    try {
      socket.write(JSON.stringify({ id, authToken, method, params }) + '\n');
    } catch (cause) {
      finish(reject, new OrcaRpcError(`Orca write failed on ${method}`, {
        method,
        code: 'socket_error',
        cause
      }));
    }
  });
}

export class OrcaRuntimeClient {
  constructor({ runtimeJsonPath = DEFAULT_RUNTIME_JSON_PATH, timeoutMs = DEFAULT_TIMEOUT_MS, connect, fsMod } = {}) {
    this.runtimeJsonPath = runtimeJsonPath;
    this.timeoutMs = timeoutMs;
    // Injected transport and fs make the module testable off the Linux host.
    this.connect = connect;
    this.fsMod = fsMod;
  }

  // Always re-reads the runtime json. Never cache the socket path or the token
  // on `this`: an Orca restart changes both.
  async request(method, params = {}) {
    const { socketPath, authToken } = await readRuntimeTarget(this.runtimeJsonPath, this.fsMod);
    return rpcOnce({
      connect: this.connect,
      socketPath,
      authToken,
      id: nextRpcId(),
      method,
      params,
      timeoutMs: this.timeoutMs
    });
  }

  async list() {
    const result = await this.request('terminal.list', {});
    return Array.isArray(result?.terminals) ? result.terminals : [];
  }

  async agentStatus(handle) {
    const result = await this.request('terminal.agentStatus', { terminal: handle });
    const status = result?.agentStatus ?? {};
    return {
      isRunningAgent: Boolean(status.isRunningAgent),
      status: status.status ?? null
    };
  }

  async send(handle, { text, enter, interrupt } = {}) {
    const params = { terminal: handle };
    if (text !== undefined) params.text = text;
    // enter and interrupt are ALWAYS booleans, and the safe default is false:
    // a caller that forgets a flag must never submit or interrupt the tab.
    params.enter = Boolean(enter);
    params.interrupt = Boolean(interrupt);

    const result = await this.request('terminal.send', params);
    const sent = result?.send ?? {};
    // A refused send answers accepted:false. Report it, never throw for it.
    return {
      handle: sent.handle ?? handle,
      accepted: Boolean(sent.accepted),
      bytesWritten: sent.bytesWritten ?? 0
    };
  }
}
