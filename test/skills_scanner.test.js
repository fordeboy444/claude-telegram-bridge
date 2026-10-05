// claude-telegram-bridge/test/skills_scanner.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { scanSkills, getBuiltInCommands, sanitizeTelegramCommand } from '../src/skills/scanner.js';
import { makeSkill, makeSkillsDirPlugin } from './helpers.js';

test('getBuiltInCommands keeps clear+compact and adds model/effort pickers', () => {
  const builtins = getBuiltInCommands();
  assert.deepEqual(builtins.map(c => c.name), ['clear', 'compact', 'model', 'effort']);

  const model = builtins.find(c => c.name === 'model');
  assert.equal(model.command, '/model');
  assert.equal(model.description, 'Switch model (fable, opus, sonnet, haiku)');
  assert.deepEqual(model.choices, ['fable', 'opus', 'sonnet', 'haiku']);

  const effort = builtins.find(c => c.name === 'effort');
  assert.equal(effort.command, '/effort');
  assert.equal(effort.description, 'Adjust thinking effort');
  assert.deepEqual(effort.choices, ['low', 'medium', 'high', 'xhigh', 'max']);
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
  await makeSkill(tmpDir, 'test-skill', 'my-skill', 'A useful skill *bold* and _italic_');

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

test('scanSkills surfaces skills inside a skills-dir plugin under a project dir', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skills-dirplugin-'));
  await makeSkillsDirPlugin(tmpDir, 'my-plugin', 'my-plugin', ' greet', 'greeting-skill', 'Say hello');

  // No explicit source: local dirs default the inner skills to plugin-local
  const skills = await scanSkills([{ dir: tmpDir, source: 'project' }]);
  assert.equal(skills.length, 1);
  assert.equal(skills[0].id, 'skillsdir:my-plugin:greeting-skill');
  assert.equal(skills[0].name, 'my-plugin:greeting-skill');
  assert.equal(skills[0].command, '/greeting-skill');
  assert.equal(skills[0].description, 'Say hello');
  assert.equal(skills[0].source, 'plugin-local');

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('scanSkills tags skills-dir plugin skills global under the global dir', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skills-dglo-'));
  await makeSkillsDirPlugin(tmpDir, 'team-tools', 'team-tools', 'ship', 'ship-skill', 'Ship it');

  const skills = await scanSkills([{ dir: tmpDir, source: 'global' }]);
  assert.equal(skills.length, 1);
  assert.equal(skills[0].name, 'team-tools:ship-skill');
  assert.equal(skills[0].source, 'plugin');

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('scanSkills skips a skills-dir plugin with a broken manifest without error', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skills-dbad-'));
  // skills/<folder> layout exists, but the manifest is corrupt -> nothing lists
  await makeSkill(path.join(tmpDir, 'broken', 'skills'), 'x', 'ghost-skill');
  await fs.mkdir(path.join(tmpDir, 'broken', '.claude-plugin'), { recursive: true });
  await fs.writeFile(path.join(tmpDir, 'broken', '.claude-plugin', 'plugin.json'), '{not json');

  const skills = await scanSkills([{ dir: tmpDir, source: 'project' }]);
  assert.deepEqual(skills, []);

  await fs.rm(tmpDir, { recursive: true, force: true });
});
