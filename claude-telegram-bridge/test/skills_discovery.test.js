// claude-telegram-bridge/test/skills_discovery.test.js
// Regression net for skills discovery: locks in the contract that local,
// user and project skill folders are all scanned, deduped, and that the
// daemon's working directory choice cannot silently hide local skills.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { scanSkills, resolveSkillsDirectories } from '../src/skills/scanner.js';

async function makeSkill(root, folderName, name, description = 'A test skill') {
  const skillFolder = path.join(root, folderName);
  await fs.mkdir(skillFolder, { recursive: true });
  await fs.writeFile(
    path.join(skillFolder, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\n---\nBody`
  );
  return skillFolder;
}

test('resolveSkillsDirectories includes local, user and project skill dirs', () => {
  const dirs = resolveSkillsDirectories({
    cwd: '/bridge',
    home: '/home/user',
    projectsDir: '/projects',
    activeSessionName: 'claude-my-app'
  });

  assert.deepEqual(dirs, [
    path.join('/bridge', '.claude', 'skills'),
    path.join('/home/user', '.claude', 'skills'),
    path.join('/projects', 'my-app', '.claude', 'skills')
  ]);
});

test('resolveSkillsDirectories omits project dir when no session is active', () => {
  const dirs = resolveSkillsDirectories({
    cwd: '/bridge',
    home: '/home/user',
    projectsDir: '/projects',
    activeSessionName: null
  });

  assert.deepEqual(dirs, [
    path.join('/bridge', '.claude', 'skills'),
    path.join('/home/user', '.claude', 'skills')
  ]);
});

test('scanSkills finds skills from every source directory (local + user + project)', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'discovery-test-'));
  const localDir = path.join(tmp, 'local');
  const userDir = path.join(tmp, 'user');
  const projectDir = path.join(tmp, 'project');

  await makeSkill(localDir, 'local-skill', 'local-skill');
  await makeSkill(userDir, 'user-skill', 'user-skill');
  await makeSkill(projectDir, 'project-skill', 'project-skill');

  const skills = await scanSkills([localDir, userDir, projectDir]);
  const names = skills.map(s => s.name).sort();

  assert.deepEqual(names, ['local-skill', 'project-skill', 'user-skill']);

  await fs.rm(tmp, { recursive: true, force: true });
});

test('scanSkills dedups identical skill names across directories (first wins)', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'dedup-test-'));
  const firstDir = path.join(tmp, 'first');
  const secondDir = path.join(tmp, 'second');

  await makeSkill(firstDir, 'shared', 'shared-skill', 'From first dir');
  await makeSkill(secondDir, 'shared', 'shared-skill', 'From second dir');

  const skills = await scanSkills([firstDir, secondDir]);

  assert.equal(skills.length, 1);
  assert.equal(skills[0].description, 'From first dir');

  await fs.rm(tmp, { recursive: true, force: true });
});

test('scanSkills follows symlinked skill folders', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'symlink-test-'));
  const scanDir = path.join(tmp, 'scan');
  const realSkill = await makeSkill(path.join(tmp, 'real'), 'actual', 'linked-skill');
  await fs.mkdir(scanDir, { recursive: true });

  try {
    await fs.symlink(realSkill, path.join(scanDir, 'linked'), 'dir');
  } catch {
    // Windows may deny symlink creation without privileges; skip on failure
    await fs.rm(tmp, { recursive: true, force: true });
    return;
  }

  const skills = await scanSkills([scanDir]);
  assert.equal(skills.length, 1);
  assert.equal(skills[0].name, 'linked-skill');

  await fs.rm(tmp, { recursive: true, force: true });
});

test('scanSkills skips broken symlinks and folders without SKILL.md', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'skip-test-'));
  const scanDir = path.join(tmp, 'scan');
  await fs.mkdir(scanDir, { recursive: true });
  await fs.mkdir(path.join(scanDir, 'no-skill-file'), { recursive: true });

  try {
    await fs.symlink(path.join(tmp, 'does-not-exist'), path.join(scanDir, 'broken'), 'dir');
  } catch {
    // Symlink creation unavailable; still verify plain folder skip
    const skills = await scanSkills([scanDir]);
    assert.equal(skills.length, 0);
    await fs.rm(tmp, { recursive: true, force: true });
    return;
  }

  const skills = await scanSkills([scanDir]);
  assert.equal(skills.length, 0);

  await fs.rm(tmp, { recursive: true, force: true });
});