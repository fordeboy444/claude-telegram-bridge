// claude-telegram-bridge/test/skills_scanner.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { scanSkills, getBuiltInCommands, sanitizeTelegramCommand } from '../src/skills/scanner.js';

test('getBuiltInCommands returns core Claude commands', () => {
  const builtins = getBuiltInCommands();
  assert.ok(builtins.some(c => c.command === '/clear'));
  assert.ok(builtins.some(c => c.command === '/compact'));
  assert.ok(builtins.some(c => c.command === '/help'));
  assert.ok(builtins.some(c => c.command === '/cost'));
  assert.ok(builtins.some(c => c.command === '/doctor'));
  assert.ok(builtins.some(c => c.command === '/review'));
});

test('sanitizeTelegramCommand produces valid Telegram command identifiers', () => {
  assert.equal(sanitizeTelegramCommand('my-cool-skill'), 'my_cool_skill');
  assert.equal(sanitizeTelegramCommand('.env-storage'), 'env_storage');
  assert.equal(sanitizeTelegramCommand('123-skill'), 'cmd_123_skill');
  assert.equal(sanitizeTelegramCommand('a'.repeat(40)), 'a'.repeat(32));
  assert.equal(sanitizeTelegramCommand(''), '');
  assert.equal(sanitizeTelegramCommand('---___---'), '');
});

test('scanSkills reads yaml frontmatter from SKILL.md files', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skills-test-'));
  const skillFolder = path.join(tmpDir, 'test-skill');
  await fs.mkdir(skillFolder, { recursive: true });
  await fs.writeFile(
    path.join(skillFolder, 'SKILL.md'),
    `---\nname: my-skill\ndescription: A useful skill *bold* and _italic_\n---\nBody here`
  );

  const skills = await scanSkills([tmpDir]);
  assert.equal(skills.length, 1);
  assert.equal(skills[0].name, 'my-skill');
  assert.equal(skills[0].description, 'A useful skill bold and italic');
  assert.equal(skills[0].command, '/my-skill');

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('scanSkills logs a warning when a directory cannot be read', async (t) => {
  const warn = t.mock.method(console, 'warn');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skills-warn-'));
  const filePath = path.join(tmpDir, 'not-a-dir');
  await fs.writeFile(filePath, 'plain file');

  const skills = await scanSkills([filePath]);

  assert.equal(skills.length, 0);
  assert.equal(warn.mock.callCount(), 1);
  assert.match(String(warn.mock.calls[0].arguments[0]), /Skills directory could not be read/);
  assert.match(String(warn.mock.calls[0].arguments.join(' ')), /not-a-dir/);

  await fs.rm(tmpDir, { recursive: true, force: true });
});
