// The bottom reply keyboard that keeps an open question reachable while the
// transcript scrolls. Telegram has no sticky message: a chat message always
// obeys chat order. A ReplyKeyboardMarkup is the only Telegram control fixed
// above the input field, so it is the Claude-Code-like anchor.
//
// A tap arrives as ordinary text (the button label). matchQuestionKeyboard
// reads the index emoji back, so a keyboard from an older page still answers
// the CURRENT page instead of a guessed label.
import { EMOJI_NUMBERS, normalizeQuestions } from './question_handler.js';

export const KEYBOARD_SUBMIT_TEXT = '✅ Submit';
export const KEYBOARD_NEXT_TEXT = '▶ Next';
// One column of buttons: long labels wrap, so cut them before the keyboard
// grows taller than the transcript on a phone.
export const LABEL_MAX = 40;

const OPTION_PREFIX = /^(?:(?:☑️|◻️|✅)\s*)?(1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|6️⃣|7️⃣|8️⃣|9️⃣|🔟)\s*/;

function shortLabel(text) {
  const value = String(text ?? '');
  return value.length > LABEL_MAX ? `${value.slice(0, LABEL_MAX - 1)}…` : value;
}

// questions: normalized list (raw payloads are normalized too).
// answers: Map<questionIndex, Set<optionIndex>>. activeIndex: the page shown.
// Returns { text, reply_markup } ready for sendMessage.
export function buildQuestionKeyboard(questions, answers = new Map(), activeIndex = 0) {
  const qs = Array.isArray(questions) ? questions : normalizeQuestions(questions);
  const total = qs.length;
  const empty = {
    text: '⬇️ Answer below.',
    reply_markup: { keyboard: [], resize_keyboard: true, is_persistent: true, one_time_keyboard: false }
  };
  if (total === 0) return empty;

  const index = Math.min(Math.max(Number.isInteger(activeIndex) ? activeIndex : 0, 0), total - 1);
  const q = qs[index];
  const isLast = index === total - 1;
  const allSingleChoice = qs.every(item => !item.multiSelect);
  const sel = answers.get(index) || new Set();
  const keyboard = [];

  q.options.forEach((opt, oi) => {
    const emoji = EMOJI_NUMBERS[oi] || `${oi + 1}️⃣`;
    const rawLabel = typeof opt === 'string' ? opt : (opt?.label || `Option ${oi + 1}`);
    // The mark shows multi-select state. A single-choice answer submits or
    // advances at once, so it needs no mark on the fixed keyboard.
    const mark = q.multiSelect ? (sel.has(oi) ? '☑️ ' : '◻️ ') : '';
    keyboard.push([{ text: `${mark}${emoji} ${shortLabel(rawLabel)}` }]);
  });

  // Mirror formatQuestionCard: a multi-select page needs an explicit exit, and
  // a trailing single-choice page after a multi-select page needs Submit
  // because the auto-submit path needs an all-single-choice set.
  if (q.multiSelect) {
    keyboard.push([{ text: isLast ? KEYBOARD_SUBMIT_TEXT : KEYBOARD_NEXT_TEXT }]);
  } else if (isLast && !allSingleChoice) {
    keyboard.push([{ text: KEYBOARD_SUBMIT_TEXT }]);
  }

  const text = total === 1
    ? '⬇️ Answer below.'
    : `⬇️ Question ${index + 1} of ${total} — answer below.`;

  return {
    text,
    reply_markup: {
      keyboard,
      resize_keyboard: true,
      is_persistent: true,
      one_time_keyboard: false
    }
  };
}

// The action a reply-keyboard tap means, or null when the text is not a
// keyboard button. { kind: 'option', oi } | { kind: 'next' } | { kind: 'submit' }
export function matchQuestionKeyboard(text, questions, activeIndex = 0) {
  const value = String(text ?? '').trim();
  if (!value) return null;
  const qs = Array.isArray(questions) ? questions : normalizeQuestions(questions);
  if (qs.length === 0) return null;

  if (value === KEYBOARD_SUBMIT_TEXT) return { kind: 'submit' };

  const index = Math.min(Math.max(Number.isInteger(activeIndex) ? activeIndex : 0, 0), qs.length - 1);
  const q = qs[index];
  const isLast = index === qs.length - 1;

  if (value === KEYBOARD_NEXT_TEXT) {
    return q?.multiSelect && !isLast ? { kind: 'next' } : null;
  }

  const match = OPTION_PREFIX.exec(value);
  if (!match) return null;
  const oi = EMOJI_NUMBERS.indexOf(match[1]);
  if (oi < 0 || !Array.isArray(q?.options) || !q.options[oi]) return null;
  return { kind: 'option', oi };
}
