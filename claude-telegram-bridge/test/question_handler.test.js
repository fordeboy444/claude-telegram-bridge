import test from 'node:test';
import assert from 'node:assert/strict';
import { formatQuestionCard } from '../src/tmux/question_handler.js';

test('formatQuestionCard formats primary question with header and options', () => {
  const payload = {
    question: 'How would you like to proceed?',
    options: [
      { label: 'Option A', description: 'Run tests' },
      { label: 'Option B', description: 'Skip tests' }
    ]
  };

  const card = formatQuestionCard(payload);
  assert.equal(typeof card.text, 'string');
  assert.ok(card.text.includes('❓ *Question*'));
  assert.ok(card.text.includes('How would you like to proceed?'));
  assert.ok(card.text.includes('1️⃣ *Option A*'));
  assert.ok(card.text.includes('_Run tests_'));
  assert.ok(card.text.includes('2️⃣ *Option B*'));
  assert.ok(card.text.includes('_Skip tests_'));
});

test('formatQuestionCard generates numbered emoji buttons with correct callback data', () => {
  const payload = {
    question: 'Select an approach:',
    options: [
      { label: 'Fast' },
      { label: 'Thorough' },
      { label: 'Safe' }
    ]
  };

  const card = formatQuestionCard(payload);
  assert.ok(card.reply_markup);
  assert.ok(Array.isArray(card.reply_markup.inline_keyboard));

  const keyboard = card.reply_markup.inline_keyboard;
  assert.equal(keyboard.length, 3);

  assert.deepEqual(keyboard[0], [{ text: '1️⃣ Fast', callback_data: 'answer_q:1' }]);
  assert.deepEqual(keyboard[1], [{ text: '2️⃣ Thorough', callback_data: 'answer_q:2' }]);
  assert.deepEqual(keyboard[2], [{ text: '3️⃣ Safe', callback_data: 'answer_q:3' }]);
});

test('formatQuestionCard handles plain string options and nested questions', () => {
  const payloadNested = {
    questions: [
      {
        question: 'Choose an option',
        options: ['String Choice 1', 'String Choice 2']
      }
    ]
  };

  const card = formatQuestionCard(payloadNested);
  assert.ok(card.text.includes('Choose an option'));
  assert.ok(card.text.includes('1️⃣ *String Choice 1*'));
  assert.ok(card.text.includes('2️⃣ *String Choice 2*'));

  const keyboard = card.reply_markup.inline_keyboard;
  assert.equal(keyboard.length, 2);
  assert.deepEqual(keyboard[0], [{ text: '1️⃣ String Choice 1', callback_data: 'answer_q:1' }]);
});

test('formatQuestionCard handles options without descriptions gracefully', () => {
  const payload = {
    question: 'Continue?',
    options: [
      { label: 'Yes' },
      { label: 'No' }
    ]
  };

  const card = formatQuestionCard(payload);
  assert.ok(card.text.includes('1️⃣ *Yes*'));
  assert.ok(!card.text.includes('_'));
});

test('formatQuestionCard handles empty or undefined payloads gracefully', () => {
  const card1 = formatQuestionCard(null);
  assert.equal(typeof card1.text, 'string');
  assert.ok(card1.text.includes('Question'));

  const card2 = formatQuestionCard(undefined);
  assert.equal(typeof card2.text, 'string');

  const card3 = formatQuestionCard({});
  assert.equal(typeof card3.text, 'string');
  assert.deepEqual(card3.reply_markup.inline_keyboard, []);
});
