export function buildProjectsMenu(projects) {
  if (projects.length === 0) {
    return {
      text: '📁 *Projects*\nNo project folders found in the configured directory.',
      reply_markup: { inline_keyboard: [] }
    };
  }

  const keyboard = projects.map(p => {
    const isRunning = p.runningSessions.length > 0;
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

export function buildProjectActionView(project) {
  const isRunning = project.runningSessions.length > 0;
  const status = isRunning
    ? `🟢 Running (${project.runningSessions.join(', ')})`
    : '⚪ Idle';

  const text = [
    `📁 *Project:* \`${project.name}\``,
    `📍 *Path:* \`${project.path}\``,
    `📊 *Status:* ${status}`,
    '',
    'Choose an action below:'
  ].join('\n');

  const keyboard = [
    [
      { text: '🚀 Start Fresh Session', callback_data: `proj_start:${project.name}` }
    ]
  ];

  if (isRunning) {
    keyboard.push([
      { text: '🛑 Kill All Sessions', callback_data: `proj_kill:${project.name}` }
    ]);
  }

  keyboard.push([
    { text: '⬅️ Back to Projects', callback_data: 'projects_list' }
  ]);

  return {
    text,
    reply_markup: { inline_keyboard: keyboard }
  };
}
