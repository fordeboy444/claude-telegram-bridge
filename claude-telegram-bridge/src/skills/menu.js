// claude-telegram-bridge/src/skills/menu.js
export function buildSkillsKeyboard(skills, page = 0, pageSize = 6) {
  const totalPages = Math.ceil(skills.length / pageSize) || 1;
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));

  const startIdx = currentPage * pageSize;
  const currentSkills = skills.slice(startIdx, startIdx + pageSize);

  const keyboard = [];
  for (let i = 0; i < currentSkills.length; i += 2) {
    const row = [];
    row.push({
      text: `⚡ ${currentSkills[i].name}`,
      callback_data: `skill_inspect:${currentSkills[i].id}`
    });
    if (i + 1 < currentSkills.length) {
      row.push({
        text: `⚡ ${currentSkills[i + 1].name}`,
        callback_data: `skill_inspect:${currentSkills[i + 1].id}`
      });
    }
    keyboard.push(row);
  }

  // Navigation row
  const navRow = [];
  if (currentPage > 0) {
    navRow.push({ text: '◀️ Prev', callback_data: `skills_page:${currentPage - 1}` });
  } else {
    navRow.push({ text: '⏹️', callback_data: 'noop' });
  }

  navRow.push({ text: `${currentPage + 1} / ${totalPages}`, callback_data: 'noop' });

  if (currentPage < totalPages - 1) {
    navRow.push({ text: 'Next ▶️', callback_data: `skills_page:${currentPage + 1}` });
  } else {
    navRow.push({ text: '⏹️', callback_data: 'noop' });
  }
  keyboard.push(navRow);

  return {
    text: `🛠️ *Skills Browser* (Page ${currentPage + 1}/${totalPages})\nTap a skill to view details or run it:`,
    reply_markup: { inline_keyboard: keyboard }
  };
}

export function buildSkillInspectView(skill) {
  const text = [
    `⚡ *${skill.name}*`,
    `\`${skill.command}\``,
    '',
    `📖 *Description:*`,
    skill.description
  ].join('\n');

  const keyboard = [
    [
      { text: '▶️ Run Skill Now', callback_data: `skill_run_now:${skill.id}` },
      { text: '✏️ Run with Arguments', callback_data: `skill_run_args:${skill.id}` }
    ],
    [
      { text: '⬅️ Back to Skills', callback_data: 'skills_page:0' }
    ]
  ];

  return {
    text,
    reply_markup: { inline_keyboard: keyboard }
  };
}
