// claude-telegram-bridge/test/plugin_skills.test.js
// Plugin skill discovery reads ~/.claude/plugins/installed_plugins.json (v2 shape):
// plugins.<name>@<marketplace> -> [ { installPath, projectPath? } ].
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { scanPluginSkills } from '../src/skills/scanner.js';

async function makePluginSkill(installPath, folder, name, description) {
  const skillFolder = path.join(installPath, 'skills', folder);
  await fs.mkdir(skillFolder, { recursive: true });
  await fs.writeFile(
    path.join(skillFolder, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\n---\nBody`
  );
}

async function writePluginsFile(home, plugins) {
  const pluginsDir = path.join(home, '.claude', 'plugins');
  await fs.mkdir(pluginsDir, { recursive: true });
  await fs.writeFile(
    path.join(pluginsDir, 'installed_plugins.json'),
    JSON.stringify({ version: 2, plugins }, null, 2)
  );
}

test('scanPluginSkills lists global plugin installs', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-global-'));
  const home = path.join(tmp, 'home');
  const installPath = path.join(tmp, 'plugins', 'superpowers');
  await makePluginSkill(installPath, 'brainstorming', 'brainstorming', 'Explore ideas');
  await writePluginsFile(home, { 'superpowers@obra': [{ installPath }] });

  const skills = await scanPluginSkills({ home, projectPath: null });

  assert.equal(skills.length, 1);
  assert.equal(skills[0].id, 'plugin:superpowers:brainstorming');
  assert.equal(skills[0].name, 'superpowers:brainstorming');
  assert.equal(skills[0].description, 'Explore ideas');
  assert.equal(skills[0].command, '/brainstorming');
  assert.equal(skills[0].source, 'plugin');
  assert.equal(skills[0].installPath, installPath);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('scanPluginSkills selects project-scoped installs for the active project', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-project-'));
  const home = path.join(tmp, 'home');
  const projectPath = path.join(tmp, 'my-app');
  const installPath = path.join(tmp, 'plugins', 'bridge');
  await makePluginSkill(installPath, 'deploy', 'deploy', 'Deploy app');
  // Deliberately different case: matching must be case-insensitive
  await writePluginsFile(home, {
    'bridge@market': [{ installPath, projectPath: projectPath.toUpperCase() }]
  });

  const skills = await scanPluginSkills({ home, projectPath });
  assert.equal(skills.length, 1);
  assert.equal(skills[0].name, 'bridge:deploy');

  await fs.rm(tmp, { recursive: true, force: true });
});

test('scanPluginSkills skips project-scoped installs when no session is active', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-nosess-'));
  const home = path.join(tmp, 'home');
  const installPath = path.join(tmp, 'plugins', 'bridge');
  await makePluginSkill(installPath, 'deploy', 'deploy', 'Deploy app');
  await writePluginsFile(home, {
    'bridge@market': [{ installPath, projectPath: path.join(tmp, 'my-app') }]
  });

  assert.deepEqual(await scanPluginSkills({ home, projectPath: null }), []);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('a project-scoped install of the same plugin beats the global one', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-prio-'));
  const home = path.join(tmp, 'home');
  const projectPath = path.join(tmp, 'my-app');
  const globalInstall = path.join(tmp, 'plugins', 'dup-global');
  const projectInstall = path.join(tmp, 'plugins', 'dup-project');
  await makePluginSkill(globalInstall, 'deploy', 'global-deploy', 'Global variant');
  await makePluginSkill(projectInstall, 'deploy', 'project-deploy', 'Project variant');
  await writePluginsFile(home, {
    'dup@market': [
      { installPath: globalInstall },
      { installPath: projectInstall, projectPath }
    ]
  });

  const skills = await scanPluginSkills({ home, projectPath });
  assert.equal(skills.length, 1);
  assert.equal(skills[0].name, 'dup:project-deploy');
  assert.equal(skills[0].installPath, projectInstall);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('scanPluginSkills skips entries with a missing installPath silently', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-missing-'));
  const home = path.join(tmp, 'home');
  const goodInstall = path.join(tmp, 'plugins', 'good');
  await makePluginSkill(goodInstall, 'a', 'good-skill', 'Good skill');
  await writePluginsFile(home, {
    'gone@market': [{ installPath: path.join(tmp, 'does-not-exist') }],
    'good@market': [{ installPath: goodInstall }]
  });

  const skills = await scanPluginSkills({ home, projectPath: null });
  assert.equal(skills.length, 1);
  assert.equal(skills[0].name, 'good:good-skill');

  await fs.rm(tmp, { recursive: true, force: true });
});

test('scanPluginSkills dedups the same skill within one installPath', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-dedup-'));
  const home = path.join(tmp, 'home');
  const installPath = path.join(tmp, 'plugins', 'dup');
  await makePluginSkill(installPath, 'a', 'same-skill', 'Same skill');
  await writePluginsFile(home, {
    'dup@one': [{ installPath }],
    'dup@two': [{ installPath }]
  });

  const skills = await scanPluginSkills({ home, projectPath: null });
  assert.equal(skills.length, 1);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('scanPluginSkills returns [] and warns on corrupt JSON', async (t) => {
  const warn = t.mock.method(console, 'warn');
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-corrupt-'));
  const home = path.join(tmp, 'home');
  await fs.mkdir(path.join(home, '.claude', 'plugins'), { recursive: true });
  await fs.writeFile(path.join(home, '.claude', 'plugins', 'installed_plugins.json'), '{not json');

  assert.deepEqual(await scanPluginSkills({ home, projectPath: null }), []);
  assert.equal(warn.mock.callCount(), 1);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('scanPluginSkills returns [] when the plugins file is missing', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-absent-'));
  assert.deepEqual(await scanPluginSkills({ home: path.join(tmp, 'home'), projectPath: null }), []);
  await fs.rm(tmp, { recursive: true, force: true });
});
