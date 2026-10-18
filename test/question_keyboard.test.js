import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQuestionKeyboard,
  matchQuestionKeyboard,
  KEYBOARD_SUBMIT_TEXT,
  KEYBOARD_NEXT_TEXT,
  LABEL_MAX
} from '../src/tmux/question_keyboard.js';

const single = [
  { question: 'Pick a color.', options: [{ label: 'Red' }, { label: 'Green' }], multiSelect: false }
];

// ---------- buildQuestionKeyboard ----------

test('buildQuestionKeyboard puts one option per row with the index emoji', () => {
  const view = buildQuestionKeyboard(single, new Map(), 0);
  assert.deepEqual(view.reply_markup.keyboard, [
    [{ text: '1️⃣ Red' }],
    [{ text: '2️⃣ Green' }]
  ]);
  assert.equal(view.reply_markup.resize_keyboard, true);
  assert.equal(view.reply_markup.is_persistent, true);
  assert.equal(view.text, '⬇️ Answer below.');
});

test('buildQuestionKeyboard adds no Submit to a pure single-choice set', () => {
  const questions = [
    { question: 'a', options: [{ label: 'A1' }, { label: 'A2' }], multiSelect: false },
    { question: 'b', options: [{ label: 'B1' }], multiSelect: false }
  ];
  const first = buildQuestionKeyboard(questions, new Map(), 0);
  assert.equal(first.reply_markup.keyboard.length, 2);
  assert.equal(first.text, '⬇️ Question 1 of 2 — answer below.');

  const last = buildQuestionKeyboard(questions, new Map(), 1);
  assert.deepEqual(last.reply_markup.keyboard, [[{ text: '1️⃣ B1' }]]);
});

test('buildQuestionKeyboard shows multi-select state and a Submit or Next control', () => {
  const questions = [
    { question: 'pick', options: [{ label: 'One' }, { label: 'Two' }], multiSelect: true },
    { question: 'next', options: [{ label: 'X' }], multiSelect: false }
  ];
  const answers = new Map([[0, new Set([1])]]);
  const view = buildQuestionKeyboard(questions, answers, 0);
  assert.deepEqual(view.reply_markup.keyboard, [
    [{ text: '◻️ 1️⃣ One' }],
    [{ text: '☑️ 2️⃣ Two' }],
    [{ text: KEYBOARD_NEXT_TEXT }]
  ]);
});

test('buildQuestionKeyboard adds Submit on the last multi-select page', () => {
  const questions = [
    { question: 'pick', options: [{ label: 'One' }], multiSelect: true }
  ];
  const view = buildQuestionKeyboard(questions, new Map([[0, new Set([0])]]), 0);
  assert.deepEqual(view.reply_markup.keyboard, [
    [{ text: '☑️ 1️⃣ One' }],
    [{ text: KEYBOARD_SUBMIT_TEXT }]
  ]);
});

test('buildQuestionKeyboard adds Submit to a trailing single-choice page after a multi-select', () => {
  const questions = [
    { question: 'pick', options: [{ label: 'One' }], multiSelect: true },
    { question: 'confirm', options: [{ label: 'Yes' }, { label: 'No' }], multiSelect: false }
  ];
  const view = buildQuestionKeyboard(questions, new Map(), 1);
  assert.deepEqual(view.reply_markup.keyboard, [
    [{ text: '1️⃣ Yes' }],
    [{ text: '2️⃣ No' }],
    [{ text: KEYBOARD_SUBMIT_TEXT }]
  ]);
});

test('buildQuestionKeyboard truncates a long label', () => {
  const long = 'x'.repeat(LABEL_MAX + 20);
  const view = buildQuestionKeyboard(
    [{ question: 'q', options: [{ label: long }], multiSelect: false }],
    new Map(),
    0
  );
  const text = view.reply_markup.keyboard[0][0].text;
  assert.equal(text.length, '1️⃣ '.length + LABEL_MAX);
  assert.ok(text.endsWith('…'));
});

test('buildQuestionKeyboard returns an empty keyboard for an empty payload', () => {
  const view = buildQuestionKeyboard(null, new Map(), 0);
  assert.deepEqual(view.reply_markup.keyboard, []);
});

// ---------- matchQuestionKeyboard ----------

test('matchQuestionKeyboard reads the option index from the emoji', () => {
  assert.deepEqual(matchQuestionKeyboard('1️⃣ Red', single, 0), { kind: 'option', oi: 0 });
  assert.deepEqual(matchQuestionKeyboard('2️⃣ Green', single, 0), { kind: 'option', oi: 1 });
});

test('matchQuestionKeyboard reads a multi-select mark', () => {
  const questions = [{ question: 'q', options: [{ label: 'A' }, { label: 'B' }], multiSelect: true }];
  assert.deepEqual(matchQuestionKeyboard('☑️ 2️⃣ B', questions, 0), { kind: 'option', oi: 1 });
  assert.deepEqual(matchQuestionKeyboard('◻️ 1️⃣ A', questions, 0), { kind: 'option', oi: 0 });
});

test('matchQuestionKeyboard accepts Submit and a valid Next only', () => {
  const questions = [
    { question: 'a', options: [{ label: 'A' }], multiSelect: true },
    { question: 'b', options: [{ label: 'B' }], multiSelect: false }
  ];
  assert.deepEqual(matchQuestionKeyboard(KEYBOARD_SUBMIT_TEXT, questions, 0), { kind: 'submit' });
  assert.deepEqual(matchQuestionKeyboard(KEYBOARD_NEXT_TEXT, questions, 0), { kind: 'next' });
  // The last page offers no Next.
  assert.equal(matchQuestionKeyboard(KEYBOARD_NEXT_TEXT, questions, 1), null);
});

test('matchQuestionKeyboard rejects ordinary text and out-of-range options', () => {
  assert.equal(matchQuestionKeyboard('hello', single, 0), null);
  assert.equal(matchQuestionKeyboard('9️⃣ Nine', single, 0), null);
  assert.equal(matchQuestionKeyboard('', single, 0), null);
});

test('matchQuestionKeyboard maps the emoji against the active page', () => {
  const questions = [
    { question: 'a', options: [{ label: 'A' }], multiSelect: false },
    { question: 'b', options: [{ label: 'B1' }, { label: 'B2' }], multiSelect: false }
  ];
  assert.deepEqual(matchQuestionKeyboard('2️⃣ B2', questions, 1), { kind: 'option', oi: 1 });
  // Page 0 has one option, so index 2 is not valid there.
  assert.equal(matchQuestionKeyboard('2️⃣ B2', questions, 0), null);
});
