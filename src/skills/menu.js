// claude-telegram-bridge/src/skills/menu.js
import { createHash } from 'node:crypto';

// Icons by kind: built-in commands ⌨️, local/project 📁, global 🌐, plugin 🧩
const SOURCE_ICONS = { local: '📁', project: '📁', global: '🌐', plugin: '🧩' };
const SOURCE_LABELS = { local: '📁 local', project: '📁 project', global: '🌐 global', plugin: '🧩 plugin' };

export function getSkillIcon(item) {
  if (item?.id?.startsWith('builtin:')) return '⌨️';
  return SOURCE_ICONS[item?.source] || '⚡';
}

// Telegram caps callback_data at 1-64 bytes, and real plugin ids reach 65+.
// All payloads therefore carry the first 8 hex chars of sha1(id) instead of the id.
export function skillHash(id) {
  return createHash('sha1').update(id).digest('hex').slice(0, 8);
}

// Annotate each skill with its callback hash and return the hash -> skill map.
// On a collision the second skill's hash is extended to 12 hex chars.
export function assignSkillHashes(skills) {
  const byHash = new Map();
  for (const skill of skills) {
    let hash = skillHash(skill.id);
    if (byHash.has(hash)) {
      hash = createHash('sha1').update(skill.id).digest('hex').slice(0, 12);
    }
    skill.hash = hash;
    byHash.set(hash, skill);
  }
  return byHash;
}

const hashOf = (skill) => skill.hash || skillHash(skill.id);

export function buildSkillsKeyboard(skills, page = 0, pageSize = 6) {
  const totalPages = Math.ceil(skills.length / pageSize) || 1;
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));

  const startIdx = currentPage * pageSize;
  const currentSkills = skills.slice(startIdx, startIdx + pageSize);

  const keyboard = [];
  for (let i = 0; i < currentSkills.length; i += 2) {
    const row = [];
    row.push({
      text: `${getSkillIcon(currentSkills[i])} ${currentSkills[i].name}`,
      callback_data: `skill_inspect:${hashOf(currentSkills[i])}`
    });
    if (i + 1 < currentSkills.length) {
      row.push({
        text: `${getSkillIcon(currentSkills[i + 1])} ${currentSkills[i + 1].name}`,
        callback_data: `skill_inspect:${hashOf(currentSkills[i + 1])}`
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
  const textParts = [
    `${getSkillIcon(skill)} *${skill.name}*`,
    `\`${skill.command}\``,
    ''
  ];
  if (!skill.id?.startsWith('builtin:') && skill.source) {
    textParts.push(`🗂️ *Source:* ${SOURCE_LABELS[skill.source] || skill.source}`, '');
  }
  textParts.push('📖 *Description:*', skill.description);
  const text = textParts.join('\n');

  const hash = hashOf(skill);
  let keyboard;
  if (Array.isArray(skill.choices) && skill.choices.length) {
    // Builtins with choices get a picker: one button per choice, 2 per row.
    keyboard = [];
    for (let i = 0; i < skill.choices.length; i += 2) {
      keyboard.push(skill.choices.slice(i, i + 2).map(choice => ({
        text: choice,
        callback_data: `skill_choice:${hash}:${choice}`
      })));
    }
  } else {
    keyboard = [
      [
        { text: '▶️ Run Skill Now', callback_data: `skill_run_now:${hash}` },
        { text: '✏️ Run with Arguments', callback_data: `skill_run_args:${hash}` }
      ]
    ];
  }
  keyboard.push([{ text: '⬅️ Back to Skills', callback_data: 'skills_page:0' }]);

  return {
    text,
    reply_markup: { inline_keyboard: keyboard }
  };
}
