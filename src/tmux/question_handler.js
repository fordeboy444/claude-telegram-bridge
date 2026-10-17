const EMOJI_NUMBERS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

// Normalize any question payload (AskUserQuestion tool input, legacy Question
// tool input) into a flat list:
//   [{ question, options: [{label, description}], multiSelect }]
export function normalizeQuestions(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.questions) && payload.questions.length > 0) {
    return payload.questions.map(q => {
      if (typeof q === 'string') return { question: q, options: [], multiSelect: false };
      return {
        question: q.question || q.label || 'Please select an option:',
        options: Array.isArray(q.options) ? q.options : [],
        multiSelect: Boolean(q.multiSelect)
      };
    });
  }
  if (payload.question) {
    return [{
      question: payload.question,
      options: Array.isArray(payload.options) ? payload.options : [],
      multiSelect: Boolean(payload.multiSelect)
    }];
  }
  return [];
}

// Build the tmux key sequence that answers every question page, then submits:
// - single-choice: the option digit selects and auto-advances to the next page
// - multi-select: Down moves the highlight, Space toggles, Right leaves the page
// - unanswered pages are skipped with Right
// After the last page the modal sits on the review screen; Enter submits it.
// answers: Map<questionIndex, Set<optionIndex>>
export function buildAnswerKeys(questions, answers = new Map()) {
  const keys = [];
  questions.forEach((q, qi) => {
    const sel = Array.from(answers.get(qi) || []).sort((a, b) => a - b);
    if (q.multiSelect) {
      let pos = 0;
      for (const oi of sel) {
        while (pos < oi) {
          keys.push('Down');
          pos++;
        }
        keys.push('Space');
      }
      keys.push('Right');
    } else if (sel.length > 0) {
      keys.push(String(sel[0] + 1));
    } else {
      keys.push('Right');
    }
  });
  keys.push('Enter');
  return keys;
}

// questions: output of normalizeQuestions (raw payloads are normalized too).
// answers: Map<questionIndex, Set<optionIndex>>.
// activeIndex: the question shown on this card. A multi-question payload is
// shown one question at a time; the caller advances the index after an answer.
export function formatQuestionCard(questions, answers = new Map(), activeIndex = 0) {
  const qs = Array.isArray(questions) ? questions : normalizeQuestions(questions);
  if (!qs || qs.length === 0) {
    return {
      text: '❓ *Question*',
      reply_markup: {
        inline_keyboard: []
      }
    };
  }

  const total = qs.length;
  const index = Math.min(Math.max(Number.isInteger(activeIndex) ? activeIndex : 0, 0), total - 1);
  const q = qs[index];
  const isSingleQuestion = total === 1;
  const isLast = index === total - 1;
  const allSingleChoice = qs.every(item => !item.multiSelect);

  const textLines = [
    isSingleQuestion
      ? (q.multiSelect ? '❓ *Question (Multiple Choice)*' : '❓ *Question*')
      : `❓ *Question ${index + 1} of ${total}*${q.multiSelect ? ' _(select several)_' : ''}`,
    '',
    isSingleQuestion ? q.question : `*${q.question}*`,
    ''
  ];

  const inline_keyboard = [];
  const sel = answers.get(index) || new Set();

  q.options.forEach((opt, oi) => {
    const emoji = EMOJI_NUMBERS[oi] || `${oi + 1}️⃣`;
    const label = typeof opt === 'string' ? opt : (opt.label || `Option ${oi + 1}`);
    const description = typeof opt === 'object' && opt !== null ? opt.description : null;

    if (q.multiSelect) {
      const checkMark = sel.has(oi) ? '☑️' : '◻️';
      textLines.push(`${emoji} ${checkMark} *${label}*`);
      if (description) {
        textLines.push(`   _${description}_`);
      }
      inline_keyboard.push([
        {
          text: `${checkMark} ${emoji} ${label}`,
          callback_data: `qa:${index}:${oi}`
        }
      ]);
    } else {
      const selected = sel.has(oi);
      textLines.push(`${emoji} ${selected ? '✅ ' : ''}*${label}*`);
      if (description) {
        textLines.push(`   _${description}_`);
      }
      inline_keyboard.push([
        {
          text: `${selected ? '✅ ' : ''}${emoji} ${label}`,
          callback_data: `qa:${index}:${oi}`
        }
      ]);
    }
  });

  // Multi-select pages need an explicit control to leave the page. The last
  // page submits. A trailing single-choice page after a multi-select page
  // also needs Submit, because the auto-submit path needs all-single-choice.
  if (q.multiSelect) {
    inline_keyboard.push([
      isLast
        ? { text: '✅ Submit', callback_data: 'submit_q' }
        : { text: '▶ Next', callback_data: `qn:${index + 1}` }
    ]);
  } else if (isLast && !allSingleChoice) {
    inline_keyboard.push([
      {
        text: '✅ Submit',
        callback_data: 'submit_q'
      }
    ]);
  }

  return {
    text: textLines.join('\n'),
    reply_markup: {
      inline_keyboard
    }
  };
}