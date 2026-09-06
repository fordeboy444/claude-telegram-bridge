const EMOJI_NUMBERS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export function formatQuestionCard(payload, selectedIndices = new Set()) {
  if (!payload) {
    return {
      text: '❓ *Question*',
      reply_markup: {
        inline_keyboard: []
      }
    };
  }

  // Support input payloads where question is either direct or in questions[0]
  let qText = payload.question;
  let isMultiSelect = Boolean(payload.multiSelect);
  if (Array.isArray(payload.questions) && payload.questions.length > 0) {
    const firstQ = payload.questions[0];
    if (!qText) {
      qText = typeof firstQ === 'string' ? firstQ : (firstQ.question || firstQ.label);
    }
    if (typeof firstQ === 'object' && firstQ !== null && firstQ.multiSelect) {
      isMultiSelect = true;
    }
  }
  const question = qText || 'Please select an option:';
  const options = Array.isArray(payload.options) ? payload.options : (Array.isArray(payload.questions) && payload.questions.length > 0 && Array.isArray(payload.questions[0].options) ? payload.questions[0].options : []);

  let textLines = [
    isMultiSelect ? '❓ *Question (Multiple Choice)*' : '❓ *Question*',
    '',
    question,
    ''
  ];

  const inline_keyboard = [];

  options.forEach((opt, idx) => {
    const emoji = EMOJI_NUMBERS[idx] || `${idx + 1}️⃣`;
    const label = typeof opt === 'string' ? opt : (opt.label || `Option ${idx + 1}`);
    const description = typeof opt === 'object' && opt !== null ? opt.description : null;

    if (isMultiSelect) {
      const isSelected = selectedIndices.has(idx);
      const checkMark = isSelected ? '☑️' : '◻️';
      textLines.push(`${emoji} ${checkMark} *${label}*`);
      if (description) {
        textLines.push(`   _${description}_`);
      }

      inline_keyboard.push([
        {
          text: `${checkMark} ${emoji} ${label}`,
          callback_data: `toggle_q:${idx}`
        }
      ]);
    } else {
      textLines.push(`${emoji} *${label}*`);
      if (description) {
        textLines.push(`   _${description}_`);
      }

      inline_keyboard.push([
        {
          text: `${emoji} ${label}`,
          callback_data: `answer_q:${idx + 1}`
        }
      ]);
    }
  });

  if (isMultiSelect && options.length > 0) {
    inline_keyboard.push([
      {
        text: '✅ Submit',
        callback_data: 'submit_q'
      }
    ]);
  }

  return {
    text: textLines.join('\n'),
    multiSelect: isMultiSelect,
    optionsCount: options.length,
    reply_markup: {
      inline_keyboard
    }
  };
}
