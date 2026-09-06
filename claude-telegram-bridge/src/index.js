import { Telegraf } from 'telegraf';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadConfig } from './config.js';
import { createAuthMiddleware } from './auth.js';
import { TmuxController } from './tmux/controller.js';
import { ClaudeSessionReader } from './tmux/session_reader.js';
import { formatQuestionCard } from './tmux/question_handler.js';
import { splitTelegramMessage } from './utils/telegram_chunker.js';
import { scanSkills, getBuiltInCommands, sanitizeTelegramCommand, resolveSkillsDirectories } from './skills/scanner.js';
import { buildSkillsKeyboard, buildSkillInspectView } from './skills/menu.js';
import { ProjectManager } from './projects/manager.js';
import { buildProjectsMenu, buildProjectActionView } from './projects/menu.js';
import { gatherDiagnostics, formatDiagnosticsMessage } from './diagnostics.js';
import { sendWithFallback } from './utils/messenger.js';

// If the daemon is launched from inside a Claude Code session (e.g. restarted
// by an agent), CLAUDE_CODE_CHILD_SESSION leaks down the wsl.exe -> tmux ->
// claude.exe chain. The tmux-spawned Claude CLI then treats itself as a child
// session and disables transcript saving, starving ClaudeSessionReader.
// Strip the marker so spawned sessions always run as top-level sessions.
delete process.env.CLAUDE_CODE_CHILD_SESSION;

export function createBot(config, deps = {}) {
  const bot = deps.bot || new Telegraf(config.botToken);
  const tmux = deps.tmux || new TmuxController(config.tmuxPath);
  const projectManager = deps.projectManager || new ProjectManager(config.projectsDir, tmux);
  const SessionReaderClass = deps.sessionReaderClass || ClaudeSessionReader;

  // State tracking
  let activeSessionName = null;
  let activeChatId = null;
  let activeSessionReader = null;
  let pendingArgsSkill = null;
  let cachedSkills = [];
  let commandMapping = new Map();
  let typingTimer = null;
  let typingChatId = null;
  let lastInjectedPrompt = null;
  let lastInjectedTime = 0;
  let activeQuestion = null;

  function startTyping(chatId) {
    if (!chatId) return;
    if (typingTimer) {
      if (typingChatId === chatId) return;
      clearInterval(typingTimer);
    }
    typingChatId = chatId;
    const sendTyping = async () => {
      if (activeSessionName) {
        let alive = true;
        try {
          alive = await tmux.hasSession(activeSessionName);
        } catch {
          alive = true;
        }
        if (!alive) {
          await notifySessionDeath(chatId);
          return;
        }
      }
      bot.telegram.sendChatAction(chatId, 'typing').catch(() => {});
    };
    sendTyping();
    typingTimer = setInterval(sendTyping, 4000);
    if (typingTimer.unref) typingTimer.unref();
  }

  function stopTyping() {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
    typingChatId = null;
  }

  // A dead tmux session must never receive injections or keep the typing
  // indicator alive. One path clears the connection and reports the death.
  async function notifySessionDeath(chatId) {
    if (!activeSessionName) return; // already cleared: no double notification
    switchActiveSession(null, null, null); // stops typing + reader, clears connection
    if (chatId) {
      await sendWithFallback(bot, chatId, '🔴 Session ended. Use /projects.');
    }
  }

  async function ensureSessionAlive(ctx) {
    if (!activeSessionName) return true;
    let alive = true;
    try {
      alive = await tmux.hasSession(activeSessionName);
    } catch {
      alive = true; // cannot check: let the sendKeys path surface real errors
    }
    if (alive) return true;
    await notifySessionDeath(ctx.chat.id);
    return false;
  }

  async function updateBotCommands() {
    const defaultCommands = [
      { command: 'projects', description: 'Manage project folders & launch sessions' },
      { command: 'skills', description: 'Browse and run Claude skills' },
      { command: 'status', description: 'View current active session' },
      { command: 'diag', description: 'Bridge health: sessions & skill sources' },
      { command: 'help', description: 'Help & usage guide' }
    ];

    commandMapping.clear();
    const telegramCommands = [...defaultCommands];
    const registeredNames = new Set(defaultCommands.map(c => c.command));

    for (const item of cachedSkills) {
      if (telegramCommands.length >= 100) break; // Telegram max limit is 100 commands

      const rawName = item.name || item.command.replace(/^\//, '');
      const sanitized = sanitizeTelegramCommand(rawName);

      if (sanitized && !registeredNames.has(sanitized)) {
        registeredNames.add(sanitized);
        commandMapping.set(sanitized, item);
        telegramCommands.push({
          command: sanitized,
          description: (item.description || 'Run Claude command').slice(0, 100)
        });
      }
    }

    // Register for the default scope AND private chats. Telegram gives
    // all_private_chats commands precedence in 1:1 chats, so a stale menu set
    // there (e.g. by another tool sharing this bot token) would otherwise
    // keep masking the freshly registered default menu.
    const scopes = [{}, { scope: { type: 'all_private_chats' } }];
    for (const extra of scopes) {
      try {
        await bot.telegram.setMyCommands(telegramCommands, extra);
      } catch (err) {
        console.warn('⚠️ Telegram command sync failed:', err.message);
      }
    }
  }

  async function refreshSkills() {
    const dirs = resolveSkillsDirectories({
      cwd: process.cwd(),
      home: os.homedir(),
      projectsDir: config.projectsDir,
      activeSessionName
    });
    const scanned = await scanSkills(dirs);
    const builtins = getBuiltInCommands();
    cachedSkills = [...builtins, ...scanned];
    await updateBotCommands();
    return cachedSkills;
  }

  // Initial registration of commands
  updateBotCommands();

  // Attach Whitelist Auth Guard
  bot.use(createAuthMiddleware(config.allowedUserIds));

  async function switchActiveSession(sessionName, chatId, projectPath) {
    stopTyping();
    if (activeSessionReader) {
      activeSessionReader.stop();
      activeSessionReader = null;
    }
    lastInjectedPrompt = null; // stale prompts must not suppress echoes in the new session

    activeSessionName = sessionName;
    activeChatId = chatId;

    if (sessionName && chatId) {
      refreshSkills().catch(err => console.warn('⚠️ Skill refresh failed:', err.message));
      const resolvedProjectName = sessionName.replace(/^claude-/, '');
      const resolvedProjectPath = projectPath || path.join(config.projectsDir, resolvedProjectName);

      // Bind the reader to this tmux session's own transcript. Sessions
      // launched before session binding have no option -> null -> newest-file fallback.
      let sessionId = null;
      try {
        sessionId = await tmux.getSessionOption(sessionName, '@claude_session_id');
      } catch {
        sessionId = null;
      }

      activeSessionReader = new SessionReaderClass();
      activeSessionReader.start(
        resolvedProjectPath,
        async (event) => {
          if (!activeChatId) return;
          if (event.type === 'user' && event.content) {
            // If the user prompt came from CLI (not recently sent from Telegram), echo to Telegram
            const isSelf = lastInjectedPrompt === event.content && (Date.now() - lastInjectedTime) < 10000;
            if (!isSelf) {
              await sendWithFallback(bot, activeChatId, `👤 *CLI User:*\n${event.content}`);
            }
            startTyping(activeChatId);
          } else if (event.type === 'text' && event.content) {
            stopTyping();
            // Send assistant text from session_reader as clean markdown text rather than wrapping in code fences (```)
            const chunks = splitTelegramMessage(event.content, 4000);
            for (const c of chunks) {
              await sendWithFallback(bot, activeChatId, c);
            }
          } else if (event.type === 'question' && event.content) {
            stopTyping();
            activeQuestion = {
              payload: event.content,
              selectedIndices: new Set()
            };
            const card = formatQuestionCard(event.content, activeQuestion.selectedIndices);
            await sendWithFallback(bot, activeChatId, card.text, { reply_markup: card.reply_markup });
          } else if (event.type === 'result') {
            // Turn ended (success or error), even with no final text block.
            stopTyping();
          }
        },
        config.pollIntervalMs,
        { sessionId }
      );
    }
  }

  // Commands
  bot.command('start', async (ctx) => {
    await ctx.reply(
      '👋 *Welcome to Claude Code Telegram Remote Bridge!*\n\n' +
      'Commands:\n' +
      '• /projects - Manage project folders & launch sessions\n' +
      '• /skills - Browse and run Claude skills\n' +
      '• /status - View current active session\n' +
      '• /diag - Bridge health: sessions & skill sources\n' +
      '• /help - Help & usage guide\n\n' +
      'Any text you send here will be forwarded directly to your active Claude Code session.',
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      '📖 *Claude Telegram Bridge Help*\n\n' +
      '• Use /projects to view project directories and start sessions.\n' +
      '• Use /skills to browse built-in commands and installed skills.\n' +
      '• Use /status to check if a session is running.\n' +
      '• Send any regular message to pass keystrokes to the active terminal.',
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('status', async (ctx) => {
    if (!activeSessionName) {
      return ctx.reply('⚪ *No active session.* Use /projects to start one.', { parse_mode: 'Markdown' });
    }
    const exists = await tmux.hasSession(activeSessionName);
    return ctx.reply(
      `🎯 *Active Session:* \`${activeSessionName}\` (${exists ? '🟢 Online' : '🔴 Terminated'})`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('projects', async (ctx) => {
    const projects = await projectManager.listProjects();
    const menu = buildProjectsMenu(projects);
    await ctx.reply(menu.text, { parse_mode: 'Markdown', reply_markup: menu.reply_markup });
  });

  bot.command('skills', async (ctx) => {
    await refreshSkills();
    const menu = buildSkillsKeyboard(cachedSkills, 0);
    await ctx.reply(menu.text, { parse_mode: 'Markdown', reply_markup: menu.reply_markup });
  });

  // Bridge health check. Named /diag to avoid clobbering the built-in
  // claude CLI passthrough /doctor (typed commands map to tmux injection).
  bot.command('diag', async (ctx) => {
    await refreshSkills();
    const diag = await gatherDiagnostics({
      cwd: process.cwd(),
      home: os.homedir(),
      projectsDir: config.projectsDir,
      activeSessionName,
      tmux
    });
    await ctx.reply(formatDiagnosticsMessage(diag), { parse_mode: 'Markdown' });
  });

  // Callback Queries
  bot.action(/skills_page:(\d+)/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10);
    const menu = buildSkillsKeyboard(cachedSkills, page);
    await ctx.editMessageText(menu.text, { parse_mode: 'Markdown', reply_markup: menu.reply_markup });
    await ctx.answerCbQuery();
  });

  bot.action(/skill_inspect:(.+)/, async (ctx) => {
    const skillId = ctx.match[1];
    const skill = cachedSkills.find(s => s.id === skillId);
    if (!skill) return ctx.answerCbQuery('Skill not found');
    const view = buildSkillInspectView(skill);
    await ctx.editMessageText(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
    await ctx.answerCbQuery();
  });

  bot.action(/skill_run_now:(.+)/, async (ctx) => {
    const skillId = ctx.match[1];
    const skill = cachedSkills.find(s => s.id === skillId);
    if (!skill) return ctx.answerCbQuery('Skill not found');

    if (!activeSessionName) {
      return ctx.reply('⚠️ No active Claude session. Use /projects to start one first.');
    }

    startTyping(ctx.chat?.id);
    await tmux.sendKeys(activeSessionName, skill.command, true);
    await ctx.answerCbQuery(`Running ${skill.name}...`);
    await ctx.reply(`⚡ Injected \`${skill.command}\` into \`${activeSessionName}\``, { parse_mode: 'Markdown' });
  });

  bot.action(/skill_run_args:(.+)/, async (ctx) => {
    const skillId = ctx.match[1];
    const skill = cachedSkills.find(s => s.id === skillId);
    if (!skill) return ctx.answerCbQuery('Skill not found');

    pendingArgsSkill = skill;
    await ctx.answerCbQuery();
    await ctx.reply(
      `✏️ Please reply with the arguments you want to pass to \`${skill.command}\` (or type /cancel):`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.action('projects_list', async (ctx) => {
    const projects = await projectManager.listProjects();
    const menu = buildProjectsMenu(projects);
    await ctx.editMessageText(menu.text, { parse_mode: 'Markdown', reply_markup: menu.reply_markup });
    await ctx.answerCbQuery();
  });

  bot.action(/project_select:(.+)/, async (ctx) => {
    const projectName = ctx.match[1];
    const projects = await projectManager.listProjects();
    const proj = projects.find(p => p.name === projectName);
    if (!proj) return ctx.answerCbQuery('Project not found');

    const view = buildProjectActionView(proj);
    await ctx.editMessageText(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
    await ctx.answerCbQuery();
  });

  bot.action(/proj_start:(.+)/, async (ctx) => {
    const projectName = ctx.match[1];
    await ctx.answerCbQuery('Starting fresh session...');
    const projects = await projectManager.listProjects();
    const proj = projects.find(p => p.name === projectName || p.displayName === projectName);
    const sessionName = await projectManager.startFreshSession(projectName, proj ? proj.path : null);
    await switchActiveSession(sessionName, ctx.chat.id, proj ? proj.path : null);

    // Re-render the action view so the user immediately sees Connect / Kill
    // (End Session) buttons instead of the stale Start Session button.
    const fresh = (await projectManager.listProjects()).find(
      p => p.name === projectName || p.displayName === projectName
    );
    if (fresh) {
      const view = buildProjectActionView(fresh);
      await ctx.editMessageText(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
    }
    await ctx.reply(
      `🚀 *Fresh session started!*\nFocused on: \`${sessionName}\`\nSend any text message to interact.`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.action(/proj_connect:(.+)/, async (ctx) => {
    const projectName = ctx.match[1];
    const projects = await projectManager.listProjects();
    const proj = projects.find(p => p.name === projectName || p.displayName === projectName);
    if (!proj) return ctx.answerCbQuery('Project not found');

    const sessionName = proj.runningSessions && proj.runningSessions[0];
    if (!sessionName || !(await tmux.hasSession(sessionName))) {
      return ctx.answerCbQuery('Session not running');
    }

    const previous = activeSessionName;
    await switchActiveSession(sessionName, ctx.chat.id, proj.path);
    await ctx.answerCbQuery(`Connected to ${sessionName}`);
    await ctx.reply(
      `🔌 Connected to ${sessionName}${previous && previous !== sessionName ? ` (was ${previous})` : ''}`
    );
  });

  bot.action(/proj_kill:(.+)/, async (ctx) => {
    const projectName = ctx.match[1];
    const activeSessionNorm = activeSessionName ? activeSessionName.replace(/^claude-/, '') : '';
    const targetNorm = projectManager.normalizeSessionName(projectName);
    const expectedActiveSession = `claude-${targetNorm}`;

    if (activeSessionName === expectedActiveSession) {
      switchActiveSession(null, null, null);
    }

    await projectManager.killCurrentSession(projectName);
    await projectManager.killProjectSessions(projectName);

    await ctx.answerCbQuery('Sessions terminated');
    await ctx.reply(`🛑 All sessions for \`${projectName}\` terminated.`, { parse_mode: 'Markdown' });
  });

  bot.action(/answer_q:(\d+)/, async (ctx) => {
    const optionNumber = ctx.match[1];
    activeQuestion = null;
    if (activeSessionName) {
      startTyping(ctx.chat?.id);
      await tmux.sendKeys(activeSessionName, optionNumber, true);
      await ctx.answerCbQuery(`Selected option ${optionNumber}`);
      await ctx.reply(`Selected option ${optionNumber}`);
    } else {
      await ctx.answerCbQuery('No active session');
    }
  });

  bot.action(/toggle_q:(\d+)/, async (ctx) => {
    const idx = parseInt(ctx.match[1], 10);
    if (!activeQuestion) {
      return ctx.answerCbQuery('Question expired or not found');
    }

    if (activeQuestion.selectedIndices.has(idx)) {
      activeQuestion.selectedIndices.delete(idx);
    } else {
      activeQuestion.selectedIndices.add(idx);
    }

    const card = formatQuestionCard(activeQuestion.payload, activeQuestion.selectedIndices);
    try {
      await ctx.editMessageText(card.text, {
        parse_mode: 'Markdown',
        reply_markup: card.reply_markup
      });
    } catch {
      // Ignore Telegram message not modified error
    }
    await ctx.answerCbQuery();
  });

  bot.action('submit_q', async (ctx) => {
    if (!activeSessionName) {
      return ctx.answerCbQuery('No active session');
    }
    if (!activeQuestion || !activeQuestion.payload) {
      return ctx.answerCbQuery('No active question to submit');
    }

    const selected = Array.from(activeQuestion.selectedIndices).sort((a, b) => a - b);
    if (selected.length === 0) {
      return ctx.answerCbQuery('Please select at least one option');
    }

    // Convert multi-select toggles into arrow down & space bar keys sequence
    // The cursor starts at index 0.
    const keys = [];
    let currentPos = 0;
    for (const targetIdx of selected) {
      while (currentPos < targetIdx) {
        keys.push('Down');
        currentPos++;
      }
      keys.push('Space');
    }
    keys.push('Enter');

    startTyping(ctx.chat?.id);
    if (typeof tmux.sendKeySequence === 'function') {
      await tmux.sendKeySequence(activeSessionName, keys);
    } else {
      for (const k of keys) {
        await tmux.sendKeys(activeSessionName, k === 'Enter' ? '' : k, k === 'Enter');
      }
    }

    const selectedLabels = selected.map(i => i + 1).join(', ');
    activeQuestion = null;
    await ctx.answerCbQuery('Submitted answers');
    await ctx.reply(`Submitted options: ${selectedLabels}`);
  });

  bot.action('noop', async (ctx) => {
    await ctx.answerCbQuery();
  });

  // Text Message Forwarding
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;

    if (text === '/cancel') {
      pendingArgsSkill = null;
      return ctx.reply('Action canceled.');
    }

    if (pendingArgsSkill) {
      const fullCommand = `${pendingArgsSkill.command} ${text}`;
      pendingArgsSkill = null;
      if (!activeSessionName) {
        return ctx.reply('⚠️ No active Claude session. Use /projects to start one.');
      }
      if (!(await ensureSessionAlive(ctx))) return;
      startTyping(ctx.chat.id);
      await tmux.sendKeys(activeSessionName, fullCommand, true);
      return ctx.reply(`⚡ Injected \`${fullCommand}\` into \`${activeSessionName}\``, { parse_mode: 'Markdown' });
    }

    // Direct slash command execution (e.g. /clear, /npm_package_flow, /context7_cli, etc.)
    if (text.startsWith('/')) {
      const parts = text.trim().split(/\s+/);
      const cmdRaw = parts[0].slice(1); // remove leading '/'
      const args = parts.slice(1).join(' ');

      // Check if command matches our mapped commands
      const matchedSkill = commandMapping.get(cmdRaw.toLowerCase());
      if (matchedSkill) {
        if (!activeSessionName) {
          return ctx.reply('⚠️ No active Claude session. Use /projects to start one first.');
        }
        if (!(await ensureSessionAlive(ctx))) return;
        const fullCmd = args ? `${matchedSkill.command} ${args}` : matchedSkill.command;
        await tmux.sendKeys(activeSessionName, fullCmd, true);
        return ctx.reply(`⚡ Injected \`${fullCmd}\` into \`${activeSessionName}\``, { parse_mode: 'Markdown' });
      }
    }

    if (!activeSessionName) {
      // Auto-attach if an active tmux session exists
      const sessions = await tmux.listSessions('claude-');
      if (sessions.length > 1) {
        return ctx.reply(
          '⚪ Multiple active sessions found. Please use /projects to select one.',
          { parse_mode: 'Markdown' }
        );
      }
      if (sessions.length === 0) {
        return ctx.reply(
          '⚪ *No active Claude Code session found.*\nPlease run `connect` or use /projects to start one.',
          { parse_mode: 'Markdown' }
        );
      }
      // Exactly one session: attach, then fall through so the triggering text is forwarded.
      const sessionName = sessions[0];
      const proj = await projectManager.findProjectBySession(sessionName);
      await switchActiveSession(sessionName, ctx.chat.id, proj?.path);
      await ctx.reply(`🎯 Auto-connected to active session: \`${sessionName}\``, { parse_mode: 'Markdown' });
    }

    // Conversational text gets the prefix so the transcript (and Claude) can
    // tell Telegram prompts apart from locally typed ones. Slash passthrough stays raw.
    if (!(await ensureSessionAlive(ctx))) return;
    const injectText = text.startsWith('/') ? text : `Telegram user: ${text}`;
    lastInjectedPrompt = injectText;
    lastInjectedTime = Date.now();
    startTyping(ctx.chat.id);
    await tmux.sendKeys(activeSessionName, injectText, true);
  });

  return {
    bot,
    switchActiveSession,
    refreshSkills,
    async attachExistingSession(chatId) {
      const sessions = await tmux.listSessions('claude-');
      if (sessions.length !== 1) return null;
      const sessionName = sessions[0];
      const project = await projectManager.findProjectBySession(sessionName);
      await switchActiveSession(sessionName, chatId, project?.path);
      return sessionName;
    },
    getActiveState: () => ({
      activeSessionName,
      activeChatId,
      pendingArgsSkill,
      typingActive: Boolean(typingTimer)
    }),
    stop: () => {
      stopTyping();
      if (activeSessionReader) {
        activeSessionReader.stop();
        activeSessionReader = null;
      }
    }
  };
}

// Auto-run if executed directly as entry script
const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  const config = loadConfig();
  const instance = createBot(config);
  await instance.refreshSkills();

  // Re-attach to any live claude-* tmux session so skills & output streaming
  // survive bridge restarts. chatId defaults to the first whitelisted user.
  const attached = await instance
    .attachExistingSession(Number(config.allowedUserIds[0]))
    .catch(() => null);
  if (attached) {
    console.log(`🔗 Re-attached to existing session: ${attached}`);
  }

  instance.bot.launch().then(() => {
    console.log('🤖 Claude Code Telegram Remote Bridge is running...');
  });

  process.once('SIGINT', () => {
    instance.stop();
    instance.bot.stop('SIGINT');
  });
  process.once('SIGTERM', () => {
    instance.stop();
    instance.bot.stop('SIGTERM');
  });
}
