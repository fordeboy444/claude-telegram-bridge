import test from 'node:test';
import assert from 'node:assert/strict';
import { formatQuestionCard, normalizeQuestions, buildAnswerKeys } from '../src/tmux/question_handler.js';
import { TmuxController } from '../src/tmux/controller.js';

// ---------- normalizeQuestions ----------

test('normalizeQuestions reads AskUserQuestion input', () => {
  const payload = {
    questions: [
      { question: 'Pick a color.', options: [{ label: 'Red' }, { label: 'Green' }], multiSelect: false },
      { question: 'Pick sizes.', options: [{ label: 'Small' }], multiSelect: true }
    ]
  };
  const qs = normalizeQuestions(payload);
  assert.equal(qs.length, 2);
  assert.equal(qs[0].question, 'Pick a color.');
  assert.equal(qs[0].options.length, 2);
  assert.equal(qs[0].multiSelect, false);
  assert.equal(qs[1].multiSelect, true);
});

test('normalizeQuestions reads legacy single-question input', () => {
  const qs = normalizeQuestions({ question: 'Proceed?', options: ['Yes', 'No'], multiSelect: false });
  assert.equal(qs.length, 1);
  assert.equal(qs[0].question, 'Proceed?');
  assert.deepEqual(qs[0].options, ['Yes', 'No']);
});

test('normalizeQuestions handles empty input', () => {
  assert.deepEqual(normalizeQuestions(null), []);
  assert.deepEqual(normalizeQuestions({}), []);
});

// ---------- buildAnswerKeys ----------

test('buildAnswerKeys: single-choice answers with digit then Enter', () => {
  const questions = [{ question: 'q', options: [{}, {}, {}], multiSelect: false }];
  const answers = new Map([[0, new Set([1])]]);
  assert.deepEqual(buildAnswerKeys(questions, answers), ['2', 'Enter']);
});

test('buildAnswerKeys: multi-select toggles then Right then Enter', () => {
  const questions = [{ question: 'q', options: [{}, {}, {}], multiSelect: true }];
  const answers = new Map([[0, new Set([0, 2])]]);
  assert.deepEqual(buildAnswerKeys(questions, answers), ['Space', 'Down', 'Down', 'Space', 'Right', 'Enter']);
});

test('buildAnswerKeys: multi-question mix with unanswered page skipped', () => {
  const questions = [
    { question: 'a', options: [{}, {}], multiSelect: false },
    { question: 'b', options: [{}, {}], multiSelect: false },
    { question: 'c', options: [{}, {}], multiSelect: true }
  ];
  const answers = new Map([
    [0, new Set([0])],
    [2, new Set([1])]
  ]);
  // q1 digit auto-advances, q2 skipped with Right, q3 toggles then Right, Enter submits.
  assert.deepEqual(buildAnswerKeys(questions, answers), ['1', 'Right', 'Down', 'Space', 'Right', 'Enter']);
});

test('buildAnswerKeys: nothing answered only navigates and submits', () => {
  const questions = [
    { question: 'a', options: [{}], multiSelect: false },
    { question: 'b', options: [{}], multiSelect: true }
  ];
  assert.deepEqual(buildAnswerKeys(questions, new Map()), ['Right', 'Right', 'Enter']);
});

// ---------- formatQuestionCard ----------

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

test('formatQuestionCard generates numbered emoji buttons with per-question callback data', () => {
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

  assert.deepEqual(keyboard[0], [{ text: '1️⃣ Fast', callback_data: 'qa:0:0' }]);
  assert.deepEqual(keyboard[1], [{ text: '2️⃣ Thorough', callback_data: 'qa:0:1' }]);
  assert.deepEqual(keyboard[2], [{ text: '3️⃣ Safe', callback_data: 'qa:0:2' }]);
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
  assert.deepEqual(keyboard[0], [{ text: '1️⃣ String Choice 1', callback_data: 'qa:0:0' }]);
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

test('formatQuestionCard supports multiSelect mode with checkboxes and submit button', () => {
  const payload = {
    questions: [
      {
        question: 'Select multiple items:',
        multiSelect: true,
        options: [
          { label: 'Item 1' },
          { label: 'Item 2' },
          { label: 'Item 3' }
        ]
      }
    ]
  };

  const answers = new Map([[0, new Set([1])]]); // Item 2 selected
  const card = formatQuestionCard(payload, answers);

  assert.ok(card.multiSelect);
  assert.ok(card.text.includes('Multiple Choice'));
  assert.ok(card.text.includes('◻️ *Item 1*'));
  assert.ok(card.text.includes('☑️ *Item 2*'));
  assert.ok(card.text.includes('◻️ *Item 3*'));

  const keyboard = card.reply_markup.inline_keyboard;
  assert.equal(keyboard.length, 4); // 3 options + 1 submit button
  assert.deepEqual(keyboard[0], [{ text: '◻️ 1️⃣ Item 1', callback_data: 'qa:0:0' }]);
  assert.deepEqual(keyboard[1], [{ text: '☑️ 2️⃣ Item 2', callback_data: 'qa:0:1' }]);
  assert.deepEqual(keyboard[2], [{ text: '◻️ 3️⃣ Item 3', callback_data: 'qa:0:2' }]);
  assert.deepEqual(keyboard[3], [{ text: '✅ Submit', callback_data: 'submit_q' }]);
});

test('formatQuestionCard renders every question of a multi-question payload', () => {
  const payload = {
    questions: [
      { question: 'Color?', options: [{ label: 'Red' }], multiSelect: false },
      { question: 'Size?', options: [{ label: 'Big' }], multiSelect: true }
    ]
  };

  const card = formatQuestionCard(payload);
  assert.ok(card.text.includes('Color?'));
  assert.ok(card.text.includes('Size?'));

  const buttons = card.reply_markup.inline_keyboard.flat();
  assert.ok(buttons.some(b => b.callback_data === 'qa:0:0'));
  assert.ok(buttons.some(b => b.callback_data === 'qa:1:0'));
  assert.ok(buttons.some(b => b.callback_data === 'submit_q'));
});

// ---------- TmuxController.sendKeysWithDelay ----------

test('sendKeysWithDelay sends each key as its own command', async () => {
  const cmds = [];
  const fakeExec = (cmd, cb) => {
    cmds.push(cmd);
    cb(null, '', '');
  };
  const tmux = new TmuxController('tmux', fakeExec);
  await tmux.sendKeysWithDelay('sess', ['2', 'Enter'], 1);
  assert.deepEqual(cmds, ['tmux send-keys -t "sess" 2', 'tmux send-keys -t "sess" Enter']);
  await tmux.sendKeysWithDelay('sess', [], 1);
  assert.equal(cmds.length, 2);
});