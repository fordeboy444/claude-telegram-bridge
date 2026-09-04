const EMOJI_NUMBERS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export function formatQuestionCard(payload) {
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
  if (!qText && Array.isArray(payload.questions) && payload.questions.length > 0) {
    const firstQ = payload.questions[0];
    qText = typeof firstQ === 'string' ? firstQ : (firstQ.question || firstQ.label);
  }
  const question = qText || 'Please select an option:';
  const options = Array.isArray(payload.options) ? payload.options : (Array.isArray(payload.questions) && payload.questions.length > 0 && Array.isArray(payload.questions[0].options) ? payload.questions[0].options : []);

  let textLines = [
    '❓ *Question*',
    '',
    question,
    ''
  ];

  const inline_keyboard = [];

  options.forEach((opt, idx) => {
    const emoji = EMOJI_NUMBERS[idx] || `${idx + 1}️⃣`;
    const label = typeof opt === 'string' ? opt : (opt.label || `Option ${idx + 1}`);
    const description = typeof opt === 'object' && opt !== null ? opt.description : null;

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
  });

  return {
    text: textLines.join('\n'),
    reply_markup: {
      inline_keyboard
    }
  };
}
