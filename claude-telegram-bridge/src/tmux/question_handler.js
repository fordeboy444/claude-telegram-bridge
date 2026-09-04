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

  const question = payload.question || 'Please select an option:';
  const options = Array.isArray(payload.options) ? payload.options : [];

  let textLines = [
    '❓ *Question*',
    '',
    question,
    ''
  ];

  const inline_keyboard = [];

  options.forEach((opt, idx) => {
    const emoji = EMOJI_NUMBERS[idx] || `${idx + 1}️⃣`;
    const label = opt.label || `Option ${idx + 1}`;
    const description = opt.description;

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
