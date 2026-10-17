import { projectNameFromSession } from './manager.js';

export function buildProjectsMenu(projects) {
  if (projects.length === 0) {
    return {
      text: '📁 *Projects*\nNo project folders found in the configured directory.',
      reply_markup: { inline_keyboard: [] }
    };
  }

  const keyboard = projects.map(p => {
    const isRunning = p.runningSessions && p.runningSessions.length > 0;
    const badge = isRunning ? '🟢' : '⚪';
    const statusText = isRunning ? `(${p.runningSessions.length} active)` : '(idle)';
    return [
      {
        text: `${badge} ${p.name} ${statusText}`,
        callback_data: `project_select:${p.name}`
      }
    ];
  });

  return {
    text: '📁 *Projects Dashboard*\nSelect a project to start or manage sessions:',
    reply_markup: { inline_keyboard: keyboard }
  };
}

// A tab's status mark. `listAgentTabs` reports 'working', 'idle' or null, so
// anything else is treated as unknown.
function tabMark(status) {
  if (status === 'working') return '🟢';
  if (status === 'idle') return '⚪️';
  return '⚫️';
}

export function buildProjectActionView(project, tabs = []) {
  const isRunning = project.runningSessions && project.runningSessions.length > 0;
  const status = isRunning
    ? `🟢 Active (Session: ${projectNameFromSession(project.runningSessions[0])})`
    : '⚪ No active current session in this project';

  const text = [
    `📁 *Project:* \`${project.name}\``,
    `📍 *Path:* \`${project.path}\``,
    `📊 *Status:* ${status}`,
    ...(tabs.length > 0 ? ['⌨️ *Terminals:*'] : []),
    '',
    'Choose an action below:'
  ].join('\n');

  const keyboard = [];

  // One row per agent tab, above the session buttons. `cleanTitle` reaches the
  // button label untouched: Telegram does not parse Markdown in button text, so
  // stripping would corrupt real titles for nothing.
  for (const tab of tabs) {
    keyboard.push([
      { text: `${tabMark(tab.status)} ${tab.cleanTitle}`, callback_data: `orca_tab:${tab.handle}` }
    ]);
  }

  if (isRunning) {
    keyboard.push([
      { text: '🛑 End Session', callback_data: `proj_kill:${project.name}` }
    ]);
  } else {
    keyboard.push([
      { text: '🚀 Start Session', callback_data: `proj_start:${project.name}` }
    ]);
  }

  keyboard.push([
    { text: '🔙 Back to Projects', callback_data: 'projects_list' }
  ]);

  return {
    text,
    reply_markup: { inline_keyboard: keyboard }
  };
}
