// Tests for the Orca runtime unix-socket RPC client. No real socket is opened:
// every client and rpcOnce call gets an injected fake net.Socket, so the suite
// runs the same on Windows and on the Linux bridge.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  OrcaRuntimeClient, OrcaRpcError, readRuntimeTarget, rpcOnce, DEFAULT_RUNTIME_JSON_PATH
} from '../src/orca/runtime_client.js';

// A fake socket: records what was written, replies with one canned JSON line.
function makeFakeSocket(reply) {
  const sock = new EventEmitter();
  sock.written = [];
  sock.ended = false;
  sock.write = (chunk) => { sock.written.push(chunk); return true; };
  sock.end = () => { sock.ended = true; };
  sock.destroy = () => {};
  setImmediate(() => {
    if (reply !== undefined) sock.emit('data', Buffer.from(JSON.stringify(reply) + '\n'));
  });
  return sock;
}

const connectTo = (reply) => () => makeFakeSocket(reply);
const OK = { id: '1', ok: true, result: { terminals: [] } };

async function writeRuntimeJson(dir, body) {
  const p = path.join(dir, 'orca-runtime.json');
  await fs.writeFile(p, JSON.stringify(body));
  return p;
}

// A fake socket that answers with the id the request itself used, so client
// calls (whose ids come from a module-level counter) stay deterministic.
function makeEchoSocket(makeReply) {
  const sock = new EventEmitter();
  sock.written = [];
  sock.ended = false;
  sock.write = (chunk) => { sock.written.push(chunk); return true; };
  sock.end = () => { sock.ended = true; };
  sock.destroy = () => {};
  setImmediate(() => {
    const request = JSON.parse(sock.written[0]);
    sock.emit('data', Buffer.from(JSON.stringify(makeReply(request)) + '\n'));
  });
  return sock;
}

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'orca-runtime-client-'));
}

const RUNTIME_BODY = {
  transports: [
    { kind: 'websocket', endpoint: 'ws://0.0.0.0:6768' },
    { kind: 'unix', endpoint: '/home/orca/.config/orca/o-27-5ad1.sock' }
  ],
  authToken: 'a'.repeat(48)
};

// --- readRuntimeTarget -----------------------------------------------------

test('readRuntimeTarget returns the unix endpoint and the token', async () => {
  const dir = await tempDir();
  const p = await writeRuntimeJson(dir, RUNTIME_BODY);

  const target = await readRuntimeTarget(p);

  assert.equal(target.socketPath, '/home/orca/.config/orca/o-27-5ad1.sock');
  assert.equal(target.authToken, 'a'.repeat(48));
});

test('readRuntimeTarget rejects a missing runtime json', async () => {
  const dir = await tempDir();
  const missing = path.join(dir, 'orca-runtime.json');

  await assert.rejects(
    () => readRuntimeTarget(missing),
    (e) => e instanceof OrcaRpcError && e.code === 'runtime_unavailable'
  );
});

test('readRuntimeTarget rejects a body with no unix transport', async () => {
  const dir = await tempDir();
  const p = await writeRuntimeJson(dir, {
    transports: [{ kind: 'websocket', endpoint: 'ws://0.0.0.0:6768' }],
    authToken: 'a'.repeat(48)
  });

  await assert.rejects(
    () => readRuntimeTarget(p),
    (e) => e instanceof OrcaRpcError && e.code === 'runtime_unavailable'
  );
});

test('readRuntimeTarget rejects a body with no authToken', async () => {
  const dir = await tempDir();
  const p = await writeRuntimeJson(dir, {
    transports: [{ kind: 'unix', endpoint: '/home/orca/.config/orca/o-27-5ad1.sock' }]
  });

  await assert.rejects(
    () => readRuntimeTarget(p),
    (e) => e instanceof OrcaRpcError && e.code === 'runtime_unavailable'
  );
});

// --- rpcOnce ---------------------------------------------------------------

test('rpcOnce writes one newline-terminated line with authToken on top', async () => {
  const sock = makeFakeSocket(OK);

  const result = await rpcOnce({
    connect: () => sock,
    socketPath: '/tmp/orca.sock',
    authToken: 'TOK',
    id: '1',
    method: 'terminal.list'
  });

  assert.equal(sock.written.length, 1);
  assert.deepEqual(JSON.parse(sock.written[0]), {
    id: '1',
    authToken: 'TOK',
    method: 'terminal.list',
    params: {}
  });
  assert.ok(sock.written[0].endsWith('\n'));
  assert.deepEqual(result, { terminals: [] });
});

test('rpcOnce maps an error reply to OrcaRpcError with the code', async () => {
  const reply = { id: '1', ok: false, error: { code: 'unauthorized', message: 'Missing auth token' } };

  await assert.rejects(
    () => rpcOnce({
      connect: connectTo(reply),
      socketPath: '/tmp/orca.sock',
      authToken: 'TOK',
      id: '1',
      method: 'terminal.list'
    }),
    (e) => e instanceof OrcaRpcError &&
      e.code === 'unauthorized' &&
      e.method === 'terminal.list' &&
      e.message === 'Missing auth token'
  );
});

test('rpcOnce rejects on timeout and destroys the socket', async () => {
  const sock = makeFakeSocket(undefined); // never answers
  let destroyed = false;
  sock.destroy = () => { destroyed = true; };

  await assert.rejects(
    () => rpcOnce({
      connect: () => sock,
      socketPath: '/tmp/orca.sock',
      authToken: 'TOK',
      id: '1',
      method: 'terminal.list',
      timeoutMs: 20
    }),
    (e) => e instanceof OrcaRpcError && e.code === 'timeout' && e.method === 'terminal.list'
  );

  assert.equal(destroyed, true);
});

test('rpcOnce rejects with socket_error when socket.write throws synchronously', async () => {
  const sock = new EventEmitter();
  sock.write = () => { throw new Error('EPIPE'); };
  sock.destroy = () => {};
  sock.end = () => {};

  await assert.rejects(
    () => rpcOnce({
      connect: () => sock,
      socketPath: '/tmp/orca.sock',
      authToken: 'TOK',
      id: '1',
      method: 'terminal.list'
    }),
    (e) => e instanceof OrcaRpcError &&
      e.code === 'socket_error' &&
      e.method === 'terminal.list' &&
      e.cause?.message === 'EPIPE'
  );
});

test('a socket error after the reply resolves is absorbed', async () => {
  const sock = makeFakeSocket(OK);

  const result = await rpcOnce({
    connect: () => sock,
    socketPath: '/tmp/orca.sock',
    authToken: 'TOK',
    id: '1',
    method: 'terminal.list'
  });
  assert.deepEqual(result, { terminals: [] });

  // With no 'error' listener attached an EventEmitter rethrows, and an
  // unhandled 'error' event kills the daemon.
  assert.doesNotThrow(() => sock.emit('error', new Error('ECONNRESET')));
  assert.deepEqual(result, { terminals: [] });
});

test('rpcOnce skips a line with another id and resolves on the matching one', async () => {
  const sock = new EventEmitter();
  sock.written = [];
  sock.write = (chunk) => { sock.written.push(chunk); return true; };
  sock.end = () => {};
  sock.destroy = () => {};
  setImmediate(() => {
    sock.emit('data', Buffer.from(
      JSON.stringify({ id: 'other', ok: true, result: { terminals: ['wrong'] } }) + '\n' +
      JSON.stringify({ id: '1', ok: true, result: { terminals: ['right'] } }) + '\n'
    ));
  });

  const result = await rpcOnce({
    connect: () => sock,
    socketPath: '/tmp/orca.sock',
    authToken: 'TOK',
    id: '1',
    method: 'terminal.list'
  });

  assert.deepEqual(result, { terminals: ['right'] });
});

// --- OrcaRuntimeClient -----------------------------------------------------

test('OrcaRuntimeClient.request re-reads the runtime json on every call', async () => {
  const dir = await tempDir();
  const p = await writeRuntimeJson(dir, RUNTIME_BODY);
  const seen = [];
  const connect = (options) => {
    seen.push(options.path);
    return makeEchoSocket((req) => ({ id: req.id, ok: true, result: { terminals: [] } }));
  };
  const client = new OrcaRuntimeClient({ runtimeJsonPath: p, connect });

  await client.request('terminal.list', {});

  await writeRuntimeJson(dir, {
    transports: [
      { kind: 'websocket', endpoint: 'ws://0.0.0.0:6768' },
      { kind: 'unix', endpoint: '/home/orca/.config/orca/o-99-beef.sock' }
    ],
    authToken: 'b'.repeat(48)
  });
  await client.request('terminal.list', {});

  assert.deepEqual(seen, [
    '/home/orca/.config/orca/o-27-5ad1.sock',
    '/home/orca/.config/orca/o-99-beef.sock'
  ]);
});

test('OrcaRuntimeClient.send passes text, enter and interrupt through', async () => {
  const dir = await tempDir();
  const p = await writeRuntimeJson(dir, RUNTIME_BODY);
  let captured;
  const connect = () => makeEchoSocket((req) => {
    captured = req;
    return { id: req.id, ok: true, result: { send: { handle: 'term_x', accepted: true, bytesWritten: 2 } } };
  });
  const client = new OrcaRuntimeClient({ runtimeJsonPath: p, connect });

  await client.send('term_x', { text: 'hi', enter: true });

  assert.deepEqual(captured.params, {
    terminal: 'term_x',
    text: 'hi',
    enter: true,
    interrupt: false
  });
});

test('OrcaRuntimeClient.send defaults enter and interrupt to false', async () => {
  const dir = await tempDir();
  const p = await writeRuntimeJson(dir, RUNTIME_BODY);
  let captured;
  const connect = () => makeEchoSocket((req) => {
    captured = req;
    return { id: req.id, ok: true, result: { send: { handle: 'term_x', accepted: true, bytesWritten: 2 } } };
  });
  const client = new OrcaRuntimeClient({ runtimeJsonPath: p, connect });

  await client.send('term_x', { text: 'hi' });

  // Both flags are always present, and both default to the safe value: a
  // caller that forgets a flag must never submit or interrupt the tab.
  assert.deepEqual(captured.params, {
    terminal: 'term_x',
    text: 'hi',
    enter: false,
    interrupt: false
  });
});

test('OrcaRuntimeClient.send reports accepted:false without throwing', async () => {
  const dir = await tempDir();
  const p = await writeRuntimeJson(dir, RUNTIME_BODY);
  const connect = () => makeEchoSocket((req) => ({
    id: req.id,
    ok: true,
    result: { send: { handle: 'term_x', accepted: false, bytesWritten: 0 } }
  }));
  const client = new OrcaRuntimeClient({ runtimeJsonPath: p, connect });

  const sent = await client.send('term_x', { text: 'hi' });

  assert.deepEqual(sent, { handle: 'term_x', accepted: false, bytesWritten: 0 });
});

test('OrcaRuntimeClient.agentStatus unwraps agentStatus', async () => {
  const dir = await tempDir();
  const p = await writeRuntimeJson(dir, RUNTIME_BODY);
  let captured;
  const connect = () => makeEchoSocket((req) => {
    captured = req;
    return { id: req.id, ok: true, result: { agentStatus: { isRunningAgent: true, status: 'working' } } };
  });
  const client = new OrcaRuntimeClient({ runtimeJsonPath: p, connect });

  const status = await client.agentStatus('term_x');

  assert.deepEqual(status, { isRunningAgent: true, status: 'working' });
  assert.equal(captured.method, 'terminal.agentStatus');
  assert.deepEqual(captured.params, { terminal: 'term_x' });
});

test('OrcaRuntimeClient.list returns the terminals array', async () => {
  const dir = await tempDir();
  const p = await writeRuntimeJson(dir, RUNTIME_BODY);
  const tabs = [{ handle: 'term_x', title: 'Main Agent' }];
  const connect = () => makeEchoSocket((req) => ({ id: req.id, ok: true, result: { terminals: tabs } }));
  const client = new OrcaRuntimeClient({ runtimeJsonPath: p, connect });

  assert.deepEqual(await client.list(), tabs);
});

test('OrcaRuntimeClient.list throws on a reply with no terminals array', async () => {
  // An empty array is a claim that the inventory is empty, and the bridge acts
  // on that claim by ending the session. A reply the bridge cannot read must
  // never become one.
  const dir = await tempDir();
  const p = await writeRuntimeJson(dir, RUNTIME_BODY);
  const connect = () => makeEchoSocket((req) => ({ id: req.id, ok: true, result: {} }));
  const client = new OrcaRuntimeClient({ runtimeJsonPath: p, connect });

  await assert.rejects(
    client.list(),
    (e) => e instanceof OrcaRpcError && e.code === 'unexpected_result'
  );
});

test('OrcaRuntimeClient.listDetailed keeps the listing scope', async () => {
  const dir = await tempDir();
  const p = await writeRuntimeJson(dir, RUNTIME_BODY);
  const tabs = [{ handle: 'term_x', title: 'Main Agent' }];
  const connect = () => makeEchoSocket((req) => ({
    id: req.id,
    ok: true,
    result: { terminals: tabs, truncated: true, hostScope: { hostIds: ['local'], omittedHostIds: [] } }
  }));
  const client = new OrcaRuntimeClient({ runtimeJsonPath: p, connect });

  assert.deepEqual(await client.listDetailed(), {
    terminals: tabs,
    truncated: true,
    hostScope: { hostIds: ['local'], omittedHostIds: [] }
  });
});

test('DEFAULT_RUNTIME_JSON_PATH is the orca-home path', () => {
  assert.equal(DEFAULT_RUNTIME_JSON_PATH, '/home/orca/.config/orca/orca-runtime.json');
});
