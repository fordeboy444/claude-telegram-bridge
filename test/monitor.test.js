import test from 'node:test';
import assert from 'node:assert/strict';
import { TmuxMonitor } from '../src/tmux/monitor.js';

test('computeDiff extracts only appended lines when terminal expands', () => {
  const monitor = new TmuxMonitor(null, 'test-sess');
  const baseline = ['Line 1', 'Line 2'];
  const current = ['Line 1', 'Line 2', 'Line 3', 'Line 4'];

  const { newLines, updatedBaseline } = monitor.computeDiff(baseline, current);
  assert.deepEqual(newLines, ['Line 3', 'Line 4']);
  assert.deepEqual(updatedBaseline, current);
});

test('computeDiff handles line updates at bottom (progress / spinner)', () => {
  const monitor = new TmuxMonitor(null, 'test-sess');
  const baseline = ['Done step 1', 'Processing: 10%'];
  const current = ['Done step 1', 'Processing: 50%'];

  const { newLines } = monitor.computeDiff(baseline, current);
  assert.deepEqual(newLines, ['Processing: 50%']);
});

test('computeDiff handles scrolled off lines without duplicating entire pane', () => {
  const monitor = new TmuxMonitor(null, 'test-sess');
  const baseline = ['Old line 1', 'Old line 2', 'Common line 3'];
  const current = ['Common line 3', 'Fresh line 4'];

  const { newLines } = monitor.computeDiff(baseline, current);
  assert.deepEqual(newLines, ['Fresh line 4']);
});

test('computeDiff handles empty previousLines initial state', () => {
  const monitor = new TmuxMonitor(null, 'test-sess');
  const current = ['Line 1', 'Line 2'];
  const { newLines, updatedBaseline } = monitor.computeDiff([], current);
  assert.deepEqual(newLines, current);
  assert.deepEqual(updatedBaseline, current);
});
