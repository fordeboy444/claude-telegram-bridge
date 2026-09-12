// claude-telegram-bridge/test/skills_menu.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSkillsKeyboard, buildSkillInspectView, getSkillIcon, skillHash, assignSkillHashes } from '../src/skills/menu.js';

test('buildSkillsKeyboard paginates 6 items per page with navigation buttons', () => {
  const dummySkills = Array.from({ length: 15 }, (_, i) => ({
    id: `skill:skill-${i}`,
    name: `Skill ${i}`,
    command: `/skill${i}`
  }));

  const page1 = buildSkillsKeyboard(dummySkills, 0, 6);
  assert.ok(page1.text.includes('Skills Browser'));
  // 6 skill buttons arranged in 3 rows (2 per row) + 1 nav row = 4 rows
  assert.equal(page1.reply_markup.inline_keyboard.length, 4);

  const navRow = page1.reply_markup.inline_keyboard[3];
  assert.ok(navRow.some(b => b.text.includes('1 / 3')));
  assert.ok(navRow.some(b => b.callback_data === 'skills_page:1'));
});

test('buildSkillsKeyboard distinguishes commands and skills with different icons', () => {
  const items = [
    { id: 'builtin:clear', name: 'clear', command: '/clear' },
    { id: 'skill:brainstorming', name: 'brainstorming', command: '/superpowers:brainstorming' }
  ];

  const menu = buildSkillsKeyboard(items, 0, 6);
  const buttonTexts = menu.reply_markup.inline_keyboard.flat().map(b => b.text);

  const commandBtn = buttonTexts.find(t => t.includes('clear'));
  const skillBtn = buttonTexts.find(t => t.includes('brainstorming'));
  assert.ok(commandBtn.startsWith('⌨️'), `expected command button to start with ⌨️, got: ${commandBtn}`);
  assert.ok(skillBtn.startsWith('⚡'), `expected skill button to start with ⚡, got: ${skillBtn}`);
  assert.notEqual(commandBtn[0], skillBtn[0]);
});

test('buildSkillInspectView shows the same icon as the browser list', () => {
  const command = { id: 'builtin:clear', name: 'clear', description: 'Clear context', command: '/clear' };
  const skill = { id: 'skill:brainstorming', name: 'Brainstorming', description: 'Explore ideas', command: '/superpowers:brainstorming' };

  assert.ok(buildSkillInspectView(command).text.startsWith('⌨️'));
  assert.ok(buildSkillInspectView(skill).text.startsWith('⚡'));
});

test('buildSkillInspectView generates Inspect card with Run buttons', () => {
  const skill = {
    id: 'skill:brainstorming',
    name: 'Brainstorming',
    description: 'Explore ideas with user',
    command: '/superpowers:brainstorming'
  };

  const card = buildSkillInspectView(skill);
  assert.ok(card.text.includes('Brainstorming'));
  assert.ok(card.text.includes('Explore ideas with user'));

  const buttons = card.reply_markup.inline_keyboard.flat();
  const h = skillHash('skill:brainstorming');
  assert.ok(buttons.some(b => b.text.includes('Run Skill Now') && b.callback_data === `skill_run_now:${h}`));
  assert.ok(buttons.some(b => b.text.includes('Run with Arguments') && b.callback_data === `skill_run_args:${h}`));
  assert.ok(buttons.some(b => b.text.includes('Back to Skills') && b.callback_data === 'skills_page:0'));
});

test('buildSkillsKeyboard uses short hashes in skill_inspect callback_data', () => {
  const skill = { id: 'skill:brainstorming', name: 'Brainstorming', command: '/superpowers:brainstorming' };
  const menu = buildSkillsKeyboard([skill], 0, 6);
  const button = menu.reply_markup.inline_keyboard.flat().find(b => b.callback_data.startsWith('skill_inspect:'));
  assert.equal(button.callback_data, `skill_inspect:${skillHash('skill:brainstorming')}`);
});

test('buildSkillInspectView uses hashed run callbacks', () => {
  const skill = { id: 'skill:brainstorming', name: 'Brainstorming', description: 'Explore ideas', command: '/superpowers:brainstorming' };
  const card = buildSkillInspectView(skill);
  const buttons = card.reply_markup.inline_keyboard.flat();
  const h = skillHash('skill:brainstorming');
  assert.ok(buttons.some(b => b.text.includes('Run Skill Now') && b.callback_data === `skill_run_now:${h}`));
  assert.ok(buttons.some(b => b.text.includes('Run with Arguments') && b.callback_data === `skill_run_args:${h}`));
  assert.ok(buttons.some(b => b.text.includes('Back to Skills') && b.callback_data === 'skills_page:0'));
});

test('buildSkillInspectView renders a choice picker for builtins with choices', () => {
  const model = {
    id: 'builtin:model', name: 'model', command: '/model',
    description: 'Switch model (fable, opus, sonnet, haiku)',
    choices: ['fable', 'opus', 'sonnet', 'haiku']
  };
  const card = buildSkillInspectView(model);
  const rows = card.reply_markup.inline_keyboard;

  const choiceButtons = rows.flat().filter(b => b.callback_data.startsWith('skill_choice:'));
  assert.equal(choiceButtons.length, 4);
  const h = skillHash('builtin:model');
  assert.ok(choiceButtons.every(b => b.callback_data === `skill_choice:${h}:${b.text}`));
  // 2 choices per row + back row
  assert.equal(rows.length, 3);
  assert.ok(!rows.flat().some(b => b.text.includes('Run Skill Now')), 'choices hide run buttons');
});

test('assignSkillHashes builds a resolvable hash map for many skills', () => {
  const skills = Array.from({ length: 200 }, (_, i) => ({ id: `skill:s${i}`, name: `s${i}` }));
  const byHash = assignSkillHashes(skills);
  assert.equal(byHash.size, skills.length);
  for (const skill of skills) {
    assert.match(skill.hash, /^[0-9a-f]{8,12}$/);
    assert.equal(byHash.get(skill.hash), skill);
  }
});

test('assignSkillHashes extends a colliding hash to 12 hex', () => {
  // Birthday search for two ids sharing an 8-hex sha1 prefix (expected within ~10^5)
  const seen = new Map();
  let firstId = null;
  let secondId = null;
  for (let i = 0; i < 1000000 && !firstId; i++) {
    const id = `skill:collide-${i}`;
    const h = skillHash(id);
    if (seen.has(h)) {
      firstId = seen.get(h);
      secondId = id;
    } else {
      seen.set(h, id);
    }
  }
  assert.ok(firstId, 'expected an 8-hex collision within 1e6 candidates');
  const skills = [{ id: firstId }, { id: secondId }];
  const byHash = assignSkillHashes(skills);
  assert.notEqual(skills[0].hash, skills[1].hash);
  assert.match(skills[1].hash, /^[0-9a-f]{12}$/);
  assert.equal(byHash.get(skills[0].hash), skills[0]);
  assert.equal(byHash.get(skills[1].hash), skills[1]);
});

test('every generated callback_data stays within the 64-byte Telegram limit', () => {
  const longPluginId = 'plugin:superpowers@some-long-marketplace:a-very-long-skill-name-here';
  const skills = [
    { id: 'builtin:model', name: 'model', command: '/model', choices: ['fable', 'opus', 'sonnet', 'haiku'] },
    { id: 'builtin:effort', name: 'effort', command: '/effort', choices: ['low', 'medium', 'high', 'xhigh', 'max'] },
    { id: longPluginId, name: 'long', description: 'long', command: '/long', source: 'plugin', hash: 'a'.repeat(12) }
  ];
  const messages = [buildSkillsKeyboard(skills, 0, 6), ...skills.map(s => buildSkillInspectView(s))];
  const all = messages.flatMap(m => m.reply_markup.inline_keyboard.flat());
  assert.ok(all.length > 10);
  for (const b of all) {
    assert.ok(b.callback_data.length <= 64, `callback_data too long (${b.callback_data.length}): ${b.callback_data}`);
  }
});

test('getSkillIcon maps each source to its icon', () => {
  assert.equal(getSkillIcon({ id: 'builtin:clear' }), '⌨️');
  assert.equal(getSkillIcon({ id: 'skill:a', source: 'local' }), '📁');
  assert.equal(getSkillIcon({ id: 'skill:a', source: 'project' }), '📁');
  assert.equal(getSkillIcon({ id: 'skill:a', source: 'global' }), '🌐');
  assert.equal(getSkillIcon({ id: 'plugin:p:a', source: 'plugin' }), '🧩');
  assert.equal(getSkillIcon({ id: 'skill:a' }), '⚡');
});

test('buildSkillInspectView shows a Source line for non-builtin skills', () => {
  const global = buildSkillInspectView({ id: 'skill:deploy', name: 'deploy', description: 'Deploy app', command: '/deploy', source: 'global' });
  assert.ok(global.text.includes('Source:'), `expected a Source line, got: ${global.text}`);
  assert.ok(global.text.includes('🌐'));

  const builtin = buildSkillInspectView({ id: 'builtin:clear', name: 'clear', description: 'Clear context', command: '/clear' });
  assert.ok(!builtin.text.includes('Source:'));
});
