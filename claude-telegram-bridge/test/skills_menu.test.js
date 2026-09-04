// claude-telegram-bridge/test/skills_menu.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSkillsKeyboard, buildSkillInspectView } from '../src/skills/menu.js';

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
  assert.ok(buttons.some(b => b.text.includes('Run Skill Now') && b.callback_data === 'skill_run_now:skill:brainstorming'));
  assert.ok(buttons.some(b => b.text.includes('Run with Arguments') && b.callback_data === 'skill_run_args:skill:brainstorming'));
  assert.ok(buttons.some(b => b.text.includes('Back to Skills') && b.callback_data === 'skills_page:0'));
});
