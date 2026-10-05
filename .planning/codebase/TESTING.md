---
last_mapped_commit: e9e6d103c3f0fd409b3ef0bccf515ab9c64500a4
last_mapped_at: 2026-10-05
---
# Testing Patterns

**Analysis Date:** 2026-10-05

## Test Framework

**Runner:**
- Node.js built-in test runner (`node --test`)
- Config: No external config file; defined in `package.json` scripts.

**Assertion Library:**
- `node:assert/strict`

**Run Commands:**

```bash
npm test              # Run all tests
```

## Test File Organization

**Location:**
- Separate `test/` directory at project root.

**Naming:**
- Pattern: `[module].test.js` (e.g., `auth.test.js`, `chunker.test.js`).

**Structure:**

```
test/
├── auth.test.js
├── chunker.test.js
├── config.test.js
└── ...
```

## Test Structure

**Suite Organization:**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

test('description of the test case', () => {
  // Arrange
  const fakeEnv = { ... };
  
  // Act
  const config = loadConfig(fakeEnv);
  
  // Assert
  assert.equal(config.botToken, '...');
});
```

**Patterns:**
- **Setup pattern:** Manual object creation for fake environments/mocks within each `test` block.
- **Teardown pattern:** Not explicitly observed (most tests are stateless/pure).
- **Assertion pattern:** Strict equality (`assert.equal`) and deep equality (`assert.deepEqual`) for objects/arrays.

## Mocking

**Framework:** Manual mocks / Dependency Injection.

**Patterns:**

```typescript
// Example from config.test.js: Mocking process.env via argument
const fakeEnv = {
  TELEGRAM_BOT_TOKEN: '123456:ABC-DEF',
  ALLOWED_USER_IDS: '111, 222'
};
const config = loadConfig(fakeEnv);
```

**What to Mock:**
- Environment variables.
- External API responses (Telegraf, tmux).

**What NOT to Mock:**
- Core utility logic (chunker, formatter).

## Fixtures and Factories

**Test Data:**
- Simple inline objects used as fake inputs (e.g., `fakeEnv` in `config.test.js`).

**Location:**
- Defined locally within the test file.

## Coverage

**Requirements:** Not enforced.

**View Coverage:**
- Not configured.

## Test Types

**Unit Tests:**
- High coverage of pure functions in `src/utils/` and `src/config.js`.
- Scope: Individual function logic.

**Integration Tests:**
- `test/integration.test.js` exists for cross-module flow.
- Scope: Interaction between components (e.g., ProjectManager and TmuxController).

**E2E Tests:**
- `test/e2e_verify.sh` provides a shell-based verification script.

## Common Patterns

**Async Testing:**

```typescript
test('async test case', async () => {
  const result = await someAsyncFunction();
  assert.equal(result, expected);
});
```

**Error Testing:**

```typescript
test('throws on missing token', () => {
  assert.throws(() => loadConfig({}), /TELEGRAM_BOT_TOKEN is required/);
});
```

---

*Testing analysis: 2026-10-05*
