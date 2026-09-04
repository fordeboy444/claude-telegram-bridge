// claude-telegram-bridge/test/skills_scanner.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { scanSkills, getBuiltInCommands } from '../src/skills/scanner.js';

test('getBuiltInCommands returns core Claude commands', () => {
  const builtins = getBuiltInCommands();
  assert.ok(builtins.some(c => c.command === '/clear'));
  assert.ok(builtins.some(c => c.command === '/compact'));
  assert.ok(builtins.some(c => c.command === '/help'));
  assert.ok(builtins.some(c => c.command === '/cost'));
  assert.ok(builtins.some(c => c.command === '/doctor'));
  assert.ok(builtins.some(c => c.command === '/review'));
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
