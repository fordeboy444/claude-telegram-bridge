import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthMiddleware } from '../src/auth.js';

test('createAuthMiddleware allows whitelisted users and calls next()', async () => {
  const allowed = ['12345', '67890'];
  const middleware = createAuthMiddleware(allowed);

  let nextCalled = false;
  const next = async () => { nextCalled = true; };
  const ctx = { from: { id: 12345 } };

  await middleware(ctx, next);
  assert.equal(nextCalled, true);
});

test('createAuthMiddleware drops non-whitelisted users without calling next()', async () => {
  const allowed = ['12345', '67890'];
  const middleware = createAuthMiddleware(allowed);

  let nextCalled = false;
  const next = async () => { nextCalled = true; };
  const ctx = { from: { id: 99999 } };

  await middleware(ctx, next);
  assert.equal(nextCalled, false);
});

test('createAuthMiddleware handles missing ctx.from gracefully', async () => {
  const allowed = ['12345'];
  const middleware = createAuthMiddleware(allowed);

  let nextCalled = false;
  const next = async () => { nextCalled = true; };
  const ctx = {};

  await middleware(ctx, next);
  assert.equal(nextCalled, false);
});
