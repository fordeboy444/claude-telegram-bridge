import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  getDefaultOrcaDataPath,
  readOrcaProjects,
  correlateOrcaProjects
} from '../src/projects/orca_reader.js';

test('getDefaultOrcaDataPath returns APPDATA path on windows or homedir fallback', () => {
  const p = getDefaultOrcaDataPath();
  assert.ok(typeof p === 'string');
  assert.ok(p.length > 0);
  if (process.platform === 'win32') {
    assert.ok(p.includes('Orca') || process.env.APPDATA);
  } else {
    assert.ok(p.includes('.config') || p.includes(os.homedir()));
  }
});

test('readOrcaProjects correlates projects with repo paths correctly', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orca-test-'));
  const dataFile = path.join(tmpDir, 'orca-data.json');

  const mockData = {
    projects: [
      { id: 'p1', name: 'Main Agent', repoIds: ['r1'] },
      { id: 'p2', name: 'Empty Project', repoIds: [] }
    ],
    repos: [
      { id: 'r1', name: 'claude-code-telegram', path: 'C:/Users/taro8/Documents/claude-code-telegram' }
    ]
  };

  await fs.writeFile(dataFile, JSON.stringify(mockData, null, 2), 'utf8');

  const projects = await readOrcaProjects(dataFile);
  assert.equal(projects.length, 2);

  const mainAgent = projects.find(p => p.name === 'Main Agent' || p.displayName === 'Main Agent');
  assert.ok(mainAgent);
  assert.equal(mainAgent.path, 'C:/Users/taro8/Documents/claude-code-telegram');
  assert.equal(mainAgent.kind, 'orca');

  const emptyProj = projects.find(p => p.name === 'Empty Project');
  assert.ok(emptyProj);
  assert.equal(emptyProj.path, null);

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('readOrcaProjects supports displayName and sourceRepoIds schema', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orca-test-schema-'));
  const dataFile = path.join(tmpDir, 'orca-data.json');

  const mockData = {
    projects: [
      { id: 'p-alt', displayName: 'Alternate Project', sourceRepoIds: ['r-alt'] }
    ],
    repos: [
      { id: 'r-alt', path: 'C:/Users/taro8/Projects/alt' }
    ]
  };

  await fs.writeFile(dataFile, JSON.stringify(mockData, null, 2), 'utf8');

  const projects = await readOrcaProjects(dataFile);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].name, 'Alternate Project');
  assert.equal(projects[0].displayName, 'Alternate Project');
  assert.equal(projects[0].path, 'C:/Users/taro8/Projects/alt');

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('readOrcaProjects handles missing or corrupted orca-data.json gracefully by returning []', async () => {
  const nonExistent = path.join(os.tmpdir(), 'non-existent-orca.json');
  const emptyRes = await readOrcaProjects(nonExistent);
  assert.deepEqual(emptyRes, []);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orca-corrupt-'));
  const corruptFile = path.join(tmpDir, 'orca-data.json');
  await fs.writeFile(corruptFile, 'NOT JSON', 'utf8');

  const corruptRes = await readOrcaProjects(corruptFile);
  assert.deepEqual(corruptRes, []);

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('correlateOrcaProjects carries repoIds onto the project', () => {
  // §6.3 matches a terminal tab to a project by repo id. The correlation
  // already reads the ids to find the path; they must survive onto the record.
  const repos = [
    { id: '6147efad-3c9e-4a1b-8f2d-0a1b2c3d4e5f', name: 'Main Agent', path: '/home/orca/Projects/Main Agent' }
  ];
  const projects = [
    { displayName: 'Main Agent', sourceRepoIds: ['6147efad-3c9e-4a1b-8f2d-0a1b2c3d4e5f'] }
  ];

  const out = correlateOrcaProjects(repos, projects);

  assert.equal(out.length, 1);
  assert.deepEqual(out[0].repoIds, ['6147efad-3c9e-4a1b-8f2d-0a1b2c3d4e5f']);
  assert.equal(out[0].path, '/home/orca/Projects/Main Agent');
});

test('correlateOrcaProjects defaults repoIds to an empty array', () => {
  // An unknown repo id must be the documented empty list, never undefined:
  // downstream does project.repoIds.includes(...).
  const out = correlateOrcaProjects([], [{ displayName: 'Orphan' }]);

  assert.equal(out.length, 1);
  assert.deepEqual(out[0].repoIds, []);
});
