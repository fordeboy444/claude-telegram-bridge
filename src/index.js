import { Telegraf } from 'telegraf';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadConfig } from './config.js';
import { createAuthMiddleware } from './auth.js';
import { TmuxController } from './tmux/controller.js';
import { ClaudeSessionReader } from './tmux/session_reader.js';
import { formatQuestionCard, normalizeQuestions, buildAnswerKeys } from './tmux/question_handler.js';
import { splitTelegramMessage } from './utils/telegram_chunker.js';
import { scanSkills, getBuiltInCommands, sanitizeTelegramCommand, resolveSkillsDirectories, scanPluginSkills } from './skills/scanner.js';
import { buildSkillsKeyboard, buildSkillInspectView, assignSkillHashes } from './skills/menu.js';
import { ProjectManager, sessionNameFor, projectNameFromSession } from './projects/manager.js';
import { buildProjectsMenu, buildProjectActionView } from './projects/menu.js';
import { gatherDiagnostics, formatDiagnosticsMessage } from './diagnostics.js';
import { gatherSessionStatus, formatStatusMessage } from './status_report.js';
import { sendWithFallback } from './utils/messenger.js';
import { tmuxTarget, orcaTarget, targetLabel, createSessionIo } from './session/target.js';
import { OrcaRuntimeClient, DEFAULT_RUNTIME_JSON_PATH } from './orca/runtime_client.js';
import { listAgentTabs, resolveTranscript } from './orca/terminals.js';

// If the daemon is launched from inside a Claude Code session (e.g. restarted
// by an agent), CLAUDE_CODE_CHILD_SESSION leaks down the wsl.exe -> tmux ->
// claude.exe chain. The tmux-spawned Claude CLI then treats itself as a child
// session and disables transcript saving, starving ClaudeSessionReader.
// Strip the marker so spawned sessions always run as top-level sessions.
delete process.env.CLAUDE_CODE_CHILD_SESSION;

// One refusal message for every injection site. A tmux key always lands (the
// controller reports accepted:true by reference), so this text can only come
// from an Orca tab that refused the write. Never report a success that did
// not happen.
const NOT_ACCEPTED = '⚠️ The tab did not accept the input. Nothing was sent.';

export function createBot(config, deps = {}) {
  const bot = deps.bot || new Telegraf(config.botToken);
  const tmux = deps.tmux || new TmuxController(config.tmuxPath);
  const projectManager = deps.projectManager || new ProjectManager(config.projectsDir, tmux);
  const SessionReaderClass = deps.sessionReaderClass || ClaudeSessionReader;
  // ONE Orca client per bot. The runtime client re-reads the socket path and the
  // token on every request, so a long-lived client survives an Orca restart and
  // no second client is ever needed.
  const orcaClient = deps.orcaClient ??
    new OrcaRuntimeClient({ runtimeJsonPath: deps.orcaRuntimeJsonPath ?? DEFAULT_RUNTIME_JSON_PATH });
  // The only place that knows which transport a target uses. Everything below
  // calls `io.*` and never asks.
  const io = createSessionIo({ tmux, orca: orcaClient });

  // State tracking. The active target names where the session lives: a tmux
  // session or an Orca agent tab.
  let activeTarget = null;
  let activeChatId = null;
  let activeProjectPath = null;
  let activeSessionReader = null;
  let pendingArgsSkill = null;
  let cachedSkills = [];
  let skillByHash = new Map();
  let commandMapping = new Map();
  let typingTimer = null;
  let typingChatId = null;
  let typingIdleTicks = 0; // consecutive transport-idle readings while typing
  let typingSawWorking = false; // the turn reached 'working' before it went idle
  // Claude's output streams through at once, but silently. Only the stop
  // notice and a question card raise a Telegram notification.
  let turnStopReported = false; // one stop notice per turn
  let activeQuestion = null;
  let questionEventCounter = 0;
  // Bumped on every switchActiveSession: reader callbacks capture their own
  // epoch and drop events when a newer switch has superseded them, so a
  // racing old reader can never fire stale events into the new session.
  let readerEpoch = 0;

  // The agent tabs that belong to ONE project. The repo id is the stable link:
  // a worktree path changes, an id does not. A project record with no id yet
  // (the legacy JSON store) falls back to the path.
  async function listProjectTabs(project) {
    const tabs = await listAgentTabs(orcaClient);
    const repoIds = Array.isArray(project?.repoIds) ? project.repoIds : [];
    if (repoIds.length > 0) {
      return tabs.filter(tab => tab.repoId !== null && repoIds.includes(tab.repoId));
    }
    return tabs.filter(tab => tab.projectPath === project?.path);
  }

  // Telegram caps callback_data at 64 bytes, so an orca_tab: callback carries
  // the handle alone. Remember which project rendered each row, so a tap on a
  // tab that has since closed can still re-render that project's card.
  const tabProjectNames = new Map();

  // One list of tabs per render, and never a throw: a down Orca must not break
  // /projects. The card simply loses its tab section, and one plain line names
  // the fault (spec §8 B2 — a stale socket and a missing runtime file are the
  // same event to the reader).
  async function tabsForProject(ctx, project) {
    let tabs;
    try {
      tabs = await listProjectTabs(project);
    } catch (err) {
      await sendWithFallback(
        bot,
        ctx.chat.id,
        `⚪ Orca is not available: ${err?.message ?? String(err)}`
      );
      return [];
    }
    for (const tab of tabs) tabProjectNames.set(tab.handle, project.name);
    return tabs;
  }

  // The card the user tapped, drawn again from live data. The remembered
  // project name is the only route back: the callback data holds one handle.
  async function rerenderProjectCard(ctx, handle) {
    const projectName = tabProjectNames.get(handle);
    tabProjectNames.delete(handle);
    const projects = await projectManager.listProjects();
    const proj = projects.find(p => p.name === projectName);
    const view = proj
      ? buildProjectActionView(proj, await tabsForProject(ctx, proj))
      : buildProjectsMenu(projects);
    try {
      await ctx.editMessageText(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
    } catch (err) {
      console.warn('⚠️ Project card refresh failed:', err.message);
    }
  }

  function startTyping(chatId) {
    if (!chatId) return;
    if (typingTimer) {
      if (typingChatId === chatId) return;
      clearInterval(typingTimer);
    }
    typingChatId = chatId;
    typingIdleTicks = 0;
    const sendTyping = async () => {
      if (activeTarget) {
        let alive = true;
        try {
          alive = await io.isAlive(activeTarget);
        } catch {
          alive = true;
        }
        if (!alive) {
          await notifySessionDeath(chatId);
          return;
        }

        // A turn can end without text and without a question. Claude Code
        // 2.1.302 writes no end-of-turn record, so the transport's own state is
        // the honest signal. Two readings in a row keep a slow start from
        // stopping the indicator early; null means the transport cannot say.
        let status = null;
        try {
          status = await io.status(activeTarget);
        } catch {
          status = null;
        }
        if (status === 'working') {
          typingSawWorking = true;
          typingIdleTicks = 0;
        } else if (status === 'idle') {
          if (++typingIdleTicks >= 2) {
            const sawWorking = typingSawWorking;
            // A background task resumes the turn by itself, so an idle reading
            // is a pause. Keep the indicator on and wait for the real stop.
            if (sawWorking && await sessionHasPendingWork()) {
              typingIdleTicks = 0;
            } else {
              stopTyping();
              // A transport that never left idle did not finish a turn: it may
              // still be starting. Only a turn that ran gets a stop notice.
              if (sawWorking) await reportTurnStop(chatId);
              return;
            }
          }
        } else {
          typingIdleTicks = 0;
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
    typingIdleTicks = 0;
    typingSawWorking = false;
  }

  // The stop notice. Its text already reached the chat, silently, so this
  // message is the notification alone: the header, no repeated answer. A
  // reason that is not a normal stop is named too.
  const STOP_NOTES = {
    interrupted: '⏹️ *Claude Code stopped* (interrupted).',
    max_tokens: '⚠️ *Claude Code stopped* (max tokens).',
    refusal: '⚠️ *Claude Code stopped* (refusal).'
  };

  async function transportIsRunning() {
    try {
      if (!activeTarget) return null;
      const status = await io.status(activeTarget);
      if (status === null) return null;
      return status !== 'idle';
    } catch {
      return null;
    }
  }

  // True when the turn pauses for work that resumes it by itself: a background
  // agent, a background command, or a running sub-agent. Claude Code then
  // continues with no user input, so the turn is not stopped.
  async function sessionHasPendingWork() {
    try {
      if (await transportIsRunning() === true) return true;
      return Boolean(await activeSessionReader?.hasPendingWork?.());
    } catch {
      return false; // an unknown state must not hide a real stop
    }
  }

  async function reportTurnStop(chatId, subtype = null) {
    if (!chatId || turnStopReported) return false;
    // An interrupt is a real stop. A pending background task is a pause.
    if (subtype !== 'interrupted' && (await sessionHasPendingWork() || await transportIsRunning() === true)) return false;
    turnStopReported = true;
    const note = STOP_NOTES[subtype]
      || (typeof subtype === 'string' && subtype.startsWith('error')
        ? '⚠️ *Claude Code stopped* (error).'
        : null);
    await sendWithFallback(bot, chatId, note || '✅ *Claude Code stopped.*');
    return true;
  }

  // A new user turn re-arms the stop notice.
  function resetTurn() {
    turnStopReported = false;
  }

  // A dead tmux session must never receive injections or keep the typing
  // indicator alive. One path clears the connection and reports the death.
  async function notifySessionDeath(chatId) {
    if (!activeTarget) return; // already cleared: no double notification
    switchActiveSession(null, null, null); // stops typing + reader, clears connection
    if (chatId) {
      await sendWithFallback(bot, chatId, '🔴 Session ended. Use /projects.');
    }
  }

  async function ensureSessionAlive(ctx) {
    if (!activeTarget) return true;
    let alive = true;
    try {
      alive = await io.isAlive(activeTarget);
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
      { command: 'interrupt', description: 'Stop the running Claude task' },
      { command: 'resources', description: 'Project skills & plugin resources' },
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
      // The scanner takes a tmux session NAME; only a tmux target has one.
      activeSessionName: activeTarget?.kind === 'tmux' ? activeTarget.sessionName : null,
      projectPath: activeProjectPath
    });
    const scanned = await scanSkills(dirs);
    const builtins = getBuiltInCommands();
    let pluginSkills = [];
    try {
      pluginSkills = await scanPluginSkills({ home: os.homedir(), projectPath: activeProjectPath });
    } catch (err) {
      console.warn('⚠️ Plugin skill scan failed:', err.message);
    }
    cachedSkills = [...builtins, ...scanned, ...pluginSkills];
    skillByHash = assignSkillHashes(cachedSkills);
    await updateBotCommands();
    return cachedSkills;
  }

  // Initial registration of commands
  updateBotCommands();

  // Attach Whitelist Auth Guard
  bot.use(createAuthMiddleware(config.allowedUserIds));

  // Argument 1 is a target record. A bare tmux session name is still accepted so
  // the existing callers (and the pre-target tests) keep working.
  async function switchActiveSession(target, chatId, projectPath) {
    const nextTarget = typeof target === 'string' ? tmuxTarget(target, projectPath ?? null) : target;
    // The raw call sites pass proj.path (which can be undefined) straight to
    // tmuxTarget, so normalise here: every target passes through this one
    // place, and the record type promises string|null.
    if (nextTarget) nextTarget.projectPath ??= null;
    const myEpoch = ++readerEpoch;
    stopTyping();
    if (activeSessionReader) {
      activeSessionReader.stop();
      activeSessionReader = null;
    }
    resetTurn(); // the outgoing turn's held text is not this session's answer
    // Question cards and "run with arguments" prompts belong to the outgoing
    // session: keeping them across switches would inject the old session's
    // keys/args into the new one.
    activeQuestion = null;
    pendingArgsSkill = null;

    activeTarget = nextTarget;
    activeChatId = chatId;
    // Real Orca worktree paths differ from projectsDir/<name>; projectNameFromSession
    // cannot invert normalizeName, so the passed projectPath is authoritative for
    // both the reader and the skills scans. A null target clears it.
    const resolvedProjectPath = projectPath
      || path.join(config.projectsDir, projectNameFromSession(nextTarget?.sessionName));
    activeProjectPath = nextTarget ? resolvedProjectPath : null;

    if (nextTarget && chatId) {
      refreshSkills().catch(err => console.warn('⚠️ Skill refresh failed:', err.message));

      // Bind the reader to this target's own transcript. Sessions launched
      // before session binding have no option -> null -> newest-file fallback.
      let sessionId = null;
      try {
        sessionId = await io.getBoundSessionId(nextTarget);
      } catch {
        sessionId = null;
      }

      // A newer switchActiveSession may have run while we resolved the room
      // option above; abandon this superseded switch so we never overwrite
      // the newer reader.
      if (myEpoch !== readerEpoch) return;

      // An Orca tab publishes no session id, so it pins its own transcript
      // file instead. `?? null` is a real value here: the reader reads
      // undefined as "no pin given" and then follows the newest file in the
      // project dir, which can be another tab's session. The pin AND the
      // callback are both required — the callback alone leaves the reader
      // silent for the first five ticks, and the pin alone cannot follow a
      // /clear inside the tab.
      const readerOptions = nextTarget.kind === 'orca'
        ? {
            sessionFile: nextTarget.transcriptFile ?? null,
            getSessionFile: () => resolveTranscript(nextTarget, { claudeHome: config.claudeHome })
          }
        : {
            sessionId,
            // After /clear, /resume or /branch the CLI starts a new session id;
            // the SessionStart hook publishes it on the tmux session and the
            // reader re-binds every 5th poll tick (closure over this target).
            getBoundSessionId: () => io.getBoundSessionId(nextTarget)
          };

      activeSessionReader = new SessionReaderClass({ claudeHome: config.claudeHome });
      activeSessionReader.start(
        resolvedProjectPath,
        async (event) => {
          if (myEpoch !== readerEpoch) return; // superseded by a later switch
          if (!activeChatId) return;
          if (event.type === 'user' && event.content) {
            // Quiet mode: a new turn starts here, but the prompt is not
            // forwarded. The reader drops the records Claude injects itself.
            resetTurn();
            startTyping(activeChatId);
          } else if (event.type === 'text' && event.content) {
            // Send the output at once, silently. Only the stop notice and a
            // question card notify the user.
            for (const chunk of splitTelegramMessage(event.content, 4000)) {
              await sendWithFallback(bot, activeChatId, chunk, { disable_notification: true });
            }
            startTyping(activeChatId);
          } else if (event.type === 'turn_end') {
            // A turn that pauses for background work is not a stop: keep the
            // indicator on and send no notice. Claude resumes by itself.
            if (event.subtype !== 'interrupted' && (await sessionHasPendingWork() || await transportIsRunning() === true)) {
              startTyping(activeChatId);
            } else {
              // The assistant ended the turn and now waits for the user.
              stopTyping();
              await reportTurnStop(activeChatId, event.subtype);
            }
          } else if (event.type === 'question' && event.content) {
            stopTyping();
            // The card carries the question. Text above it is not the answer,
            // and a stop after the answer must produce its own notice.
            resetTurn();
            questionEventCounter++;
            const questions = normalizeQuestions(event.content);
            activeQuestion = {
              questions,
              answers: new Map(),
              // One question is shown at a time; the card advances after each answer.
              index: 0
            };
            const card = formatQuestionCard(questions, activeQuestion.answers, activeQuestion.index);
            await sendWithFallback(bot, activeChatId, card.text, { reply_markup: card.reply_markup });
          } else if (event.type === 'result') {
            // Turn ended (success or error), even with no final text block.
            stopTyping();
            await reportTurnStop(activeChatId, event.subtype);
          }
        },
        config.pollIntervalMs,
        readerOptions
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
      '• /interrupt - Stop the running Claude task\n' +
      '• /resources - Project skills & plugin resources\n' +
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
      '• Use /interrupt to stop the running Claude task.\n' +
      '• Use /resources to view the project\'s skills and plugins.\n' +
      '• Send any regular message to pass keystrokes to the active terminal.',
      { parse_mode: 'Markdown' }
    );
  });

  bot.command('status', async (ctx) => {
    if (!activeTarget) {
      return ctx.reply('⚪ *No active session.* Use /projects to start one.', { parse_mode: 'Markdown' });
    }
    let exists = true;
    try {
      exists = await io.isAlive(activeTarget);
    } catch {
      exists = true; // cannot check: let the gather step surface real errors
    }

    const legacyLine = (note = '') => {
      const text = `🎯 *Active Session:* \`${targetLabel(activeTarget)}\` (${exists ? '🟢 Online' : '🔴 Terminated'})`;
      return ctx.reply(note ? `${text}\n⚠️ ${note}` : text, { parse_mode: 'Markdown' });
    };

    // Read the session id fresh so dashboard data follows /clear hops.
    let sessionId = null;
    try {
      sessionId = await io.getBoundSessionId(activeTarget);
    } catch {
      sessionId = null;
    }
    if (!sessionId && activeSessionReader) {
      sessionId = activeSessionReader.sessionId || null;
    }

    try {
      const status = await gatherSessionStatus({
        claudeHome: config.claudeHome,
        projectPath: activeProjectPath || path.join(config.projectsDir, projectNameFromSession(targetLabel(activeTarget))),
        sessionId,
        now: Date.now()
      });
      return ctx.reply(
        formatStatusMessage({ sessionName: targetLabel(activeTarget), alive: exists, status }),
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.warn('⚠️ status gather failed:', err.message);
      return legacyLine('dashboard data unavailable');
    }
  });

  // Interrupt the running task by pressing Escape in the pane (Claude Code has
  // no /interrupt slash command). Named /interrupt so typing it never reaches
  // the pane as text. Send exactly ONE Escape: two
  // fast presses trigger Claude Code's rewind feature. The send also cancels
  // an open question modal in the pane, so drop the Telegram card state.
  bot.command('interrupt', async (ctx) => {
    if (!activeTarget) {
      return ctx.reply('⚠️ No active Claude session. Use /projects to start one first.');
    }
    if (!(await ensureSessionAlive(ctx))) return;
    await io.interrupt(activeTarget);
    activeQuestion = null;
    stopTyping();
    return ctx.reply(`🛑 Interrupt sent to \`${targetLabel(activeTarget)}\``, { parse_mode: 'Markdown' });
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

  // Project resources card. Named /resources; typed commands map to tmux
  // injection, so this slash form keeps it out of the pane (like /doctor).
  async function handleResources(ctx) {
    await refreshSkills();
    const diag = await gatherDiagnostics({
      cwd: process.cwd(),
      home: os.homedir(),
      projectsDir: config.projectsDir,
      // The diagnostics card still takes a tmux session NAME.
      activeSessionName: activeTarget?.kind === 'tmux' ? activeTarget.sessionName : null,
      activeProjectPath,
      tmux
    });
    await ctx.reply(formatDiagnosticsMessage(diag), { parse_mode: 'Markdown' });
  }
  bot.command('resources', handleResources);

  // Callback Queries
  bot.action(/skills_page:(\d+)/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10);
    const menu = buildSkillsKeyboard(cachedSkills, page);
    await ctx.editMessageText(menu.text, { parse_mode: 'Markdown', reply_markup: menu.reply_markup });
    await ctx.answerCbQuery();
  });

  bot.action(/skill_inspect:([0-9a-f]{8,12})/, async (ctx) => {
    const skill = skillByHash.get(ctx.match[1]);
    if (!skill) return ctx.answerCbQuery('Skill not found');
    const view = buildSkillInspectView(skill);
    await ctx.editMessageText(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
    await ctx.answerCbQuery();
  });

  // Action handlers must never leave the inline button spinning: answer the
  // callback and report the error even when a tmux/Telegram call throws.
  async function runActionHandler(ctx, handler) {
    try {
      await handler(ctx);
    } catch (err) {
      console.warn('⚠️ action failed:', err.message);
      await ctx.answerCbQuery('Action failed').catch(() => {});
      await ctx.reply(`⚠️ Action failed: ${err.message}`).catch(() => {});
    }
  }

  bot.action(/skill_run_now:([0-9a-f]{8,12})/, (ctx) => runActionHandler(ctx, async (ctx) => {
    const skill = skillByHash.get(ctx.match[1]);
    if (!skill) return ctx.answerCbQuery('Skill not found');

    if (!activeTarget) {
      await ctx.answerCbQuery().catch(() => {});
      return ctx.reply('⚠️ No active Claude session. Use /projects to start one first.');
    }

    startTyping(ctx.chat?.id);
    const answer = await io.sendText(activeTarget, skill.command, true);
    if (!answer.accepted) {
      stopTyping();
      await ctx.answerCbQuery().catch(() => {});
      return ctx.reply(NOT_ACCEPTED);
    }
    await ctx.answerCbQuery(`Running ${skill.name}...`);
    await ctx.reply(`⚡ Injected \`${skill.command}\` into \`${targetLabel(activeTarget)}\``, { parse_mode: 'Markdown' });
  }));

  bot.action(/skill_run_args:([0-9a-f]{8,12})/, (ctx) => runActionHandler(ctx, async (ctx) => {
    const skill = skillByHash.get(ctx.match[1]);
    if (!skill) return ctx.answerCbQuery('Skill not found');

    pendingArgsSkill = skill;
    await ctx.answerCbQuery();
    await ctx.reply(
      `✏️ Please reply with the arguments you want to pass to \`${skill.command}\` (or type /cancel):`,
      { parse_mode: 'Markdown' }
    );
  }));

  bot.action(/skill_choice:([0-9a-f]{8,12}):(\w+)/, (ctx) => runActionHandler(ctx, async (ctx) => {
    const skill = skillByHash.get(ctx.match[1]);
    if (!skill) return ctx.answerCbQuery('Skill not found');

    if (!activeTarget) {
      await ctx.answerCbQuery().catch(() => {});
      return ctx.reply('⚠️ No active Claude session. Use /projects to start one first.');
    }

    const fullCmd = `${skill.command} ${ctx.match[2]}`;
    startTyping(ctx.chat?.id);
    const answer = await io.sendText(activeTarget, fullCmd, true);
    if (!answer.accepted) {
      stopTyping();
      await ctx.answerCbQuery().catch(() => {});
      return ctx.reply(NOT_ACCEPTED);
    }
    await ctx.answerCbQuery(`Running ${fullCmd}...`);
    await ctx.reply(`⚡ Injected \`${fullCmd}\` into \`${targetLabel(activeTarget)}\``, { parse_mode: 'Markdown' });
  }));

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

    // Selecting a project with a live session enters it instead of steering
    // the user to a fresh start. Prefer the exact main session:
    // runningSessions mixes claude-<proj> with claude-<proj>-2 variants.
    const preferred = proj.runningSessions?.includes(sessionNameFor(proj.name))
      ? sessionNameFor(proj.name)
      : proj.runningSessions?.[0];
    if (preferred && await tmux.hasSession(preferred)) {
      // Teardown of the previous reader/question state happens inside
      // switchActiveSession; the fresh-start path stays available only when
      // no live session exists (or after End Session).
      await switchActiveSession(tmuxTarget(preferred, proj.path), ctx.chat.id, proj.path);
      await ctx.answerCbQuery(`🔌 Entered ${preferred}`);
    } else {
      await ctx.answerCbQuery();
    }

    // Keep rendering the card so End Session stays reachable after entering.
    const view = buildProjectActionView(proj, await tabsForProject(ctx, proj));
    await ctx.editMessageText(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
  });

  // Tap a tab row: make it the active target, exactly like a tmux session.
  // The callback data carries the handle only, so the tab is looked up again
  // here — the card can be minutes old by the time it is tapped.
  bot.action(/^orca_tab:(term_[A-Za-z0-9-]+)$/, (ctx) => runActionHandler(ctx, async (ctx) => {
    const handle = ctx.match[1];
    const tab = (await listAgentTabs(orcaClient)).find(t => t.handle === handle);

    if (!tab) {
      await ctx.answerCbQuery('Tab closed').catch(() => {});
      await sendWithFallback(bot, ctx.chat.id, '🛑 That tab is no longer open.');
      await rerenderProjectCard(ctx, handle);
      return;
    }

    const target = orcaTarget({
      handle: tab.handle,
      title: tab.cleanTitle,
      projectPath: tab.projectPath,
      transcriptFile: await resolveTranscript(tab, { claudeHome: config.claudeHome })
    });

    // Switch first: the target must be live before the confirmation lands, or
    // a reply typed straight after the join would go to the old session.
    await switchActiveSession(target, ctx.chat.id, tab.projectPath);
    if (tab.status === 'working') startTyping(ctx.chat.id);

    await ctx.answerCbQuery(`Joined ${tab.cleanTitle}`).catch(() => {});
    // One message, and no history: the reader adopts the transcript at its
    // current size, so earlier turns are never replayed (G6).
    await sendWithFallback(
      bot,
      ctx.chat.id,
      `🔗 *Joined:* ${tab.cleanTitle}\n_Send a message to continue. Earlier messages are not shown._`
    );
  }));

  bot.action(/proj_start:(.+)/, (ctx) => runActionHandler(ctx, async (ctx) => {
    const projectName = ctx.match[1];
    const projects = await projectManager.listProjects();
    const proj = projects.find(p => p.name === projectName || p.displayName === projectName);

    // The card can be stale at press time: re-check tmux just before the
    // fresh start so startFreshSession never kills a live session the user
    // did not stop. The exact main session is checked first, then variants.
    let live = null;
    const candidates = [
      sessionNameFor(projectName),
      ...((proj?.runningSessions) || [])
    ];
    for (const s of candidates) {
      if (await tmux.hasSession(s)) { live = s; break; }
    }
    if (live) {
      await switchActiveSession(tmuxTarget(live, proj ? proj.path : null), ctx.chat.id, proj ? proj.path : null);
      await ctx.answerCbQuery(`▶️ Resumed ${live}`);
      await ctx.reply(
        `▶️ Resumed the \`${live}\` session (it was still running). End it first to start fresh.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    await ctx.answerCbQuery('Starting fresh session...');
    const sessionName = await projectManager.startFreshSession(projectName, proj ? proj.path : null);
    await switchActiveSession(tmuxTarget(sessionName, proj ? proj.path : null), ctx.chat.id, proj ? proj.path : null);

    // Re-render the action view so the user immediately sees Connect / Kill
    // (End Session) buttons instead of the stale Start Session button.
    const fresh = (await projectManager.listProjects()).find(
      p => p.name === projectName || p.displayName === projectName
    );
    if (fresh) {
      const view = buildProjectActionView(fresh, await tabsForProject(ctx, fresh));
      await ctx.editMessageText(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
    }
    await ctx.reply(
      `🚀 *Fresh session started!*\nFocused on: \`${sessionName}\`\nSend any text message to interact.`,
      { parse_mode: 'Markdown' }
    );
  }));

  bot.action(/proj_connect:(.+)/, async (ctx) => {
    const projectName = ctx.match[1];
    const projects = await projectManager.listProjects();
    const proj = projects.find(p => p.name === projectName || p.displayName === projectName);
    if (!proj) return ctx.answerCbQuery('Project not found');

    const sessionName = proj.runningSessions && proj.runningSessions[0];
    if (!sessionName || !(await tmux.hasSession(sessionName))) {
      return ctx.answerCbQuery('Session not running');
    }

    const previous = activeTarget;
    await switchActiveSession(tmuxTarget(sessionName, proj.path), ctx.chat.id, proj.path);
    await ctx.answerCbQuery(`Connected to ${sessionName}`);
    const previousLabel = previous ? targetLabel(previous) : null;
    await ctx.reply(
      `🔌 Connected to ${sessionName}${previousLabel && previousLabel !== sessionName ? ` (was ${previousLabel})` : ''}`
    );
  });

  bot.action(/proj_kill:(.+)/, async (ctx) => {
    const projectName = ctx.match[1];
    // listProjects/killProjectSessions treat a project's sessions as
    // claude-<norm> and any claude-<norm>-<suffix> variant; the active
    // connection must be cleared for both shapes. Killing tmux sessions never
    // clears an Orca tab target: that tab is not a tmux session.
    const targetPrefix = sessionNameFor(projectName);
    if (
      activeTarget?.kind === 'tmux' &&
      (
        activeTarget.sessionName === targetPrefix ||
        activeTarget.sessionName.startsWith(`${targetPrefix}-`)
      )
    ) {
      switchActiveSession(null, null, null);
    }

    await projectManager.killCurrentSession(projectName);
    await projectManager.killProjectSessions(projectName);

    await ctx.answerCbQuery('Sessions terminated');

    // Re-render the action view so the user immediately sees Start Session
    // and the idle status instead of the stale End Session button.
    const fresh = (await projectManager.listProjects()).find(
      p => p.name === projectName || p.displayName === projectName
    );
    if (fresh) {
      const view = buildProjectActionView(fresh, await tabsForProject(ctx, fresh));
      try {
        await ctx.editMessageText(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
      } catch (err) {
        console.warn('⚠️ Project card refresh failed:', err.message);
      }
    }
    await ctx.reply(`🛑 All sessions for \`${projectName}\` terminated.`, { parse_mode: 'Markdown' });
  });

  // After key playback the question modal should close. Claude Code redraws
  // the modal between keystrokes and can drop a key, so confirm the submission
  // and drive the modal home. Both transports show the same modal text: Enter
  // on the review screen, Right on a question page. An Orca tab also reports
  // 'working' when the turn resumes, but a fast model can leave 'working'
  // before the first poll, so the screen is the durable signal. Returns false
  // when the modal stays open (keys lost or session dead). Aborts silently if
  // a NEW question appears: a new modal means the old one already closed.
  async function ensureModalSubmitted(target, counterAtStart) {
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 600));
      if (questionEventCounter !== counterAtStart) return true;

      // 'working' means the modal closed and Claude resumed the turn.
      if (target.kind === 'orca' && (await io.status(target)) === 'working') return true;

      let screen = '';
      try {
        screen = await io.readScreen(target);
      } catch {
        return false;
      }
      if (!screen.trim()) return false;
      if (/Submit answers/.test(screen)) {
        await io.sendKeys(target, ['Enter'], 200);
      } else if (/Esc to cancel/.test(screen)) {
        await io.sendKeys(target, ['Right'], 200);
      } else {
        return true; // modal gone: submitted
      }
    }
    return false;
  }

  // Show one question page of a multi-question card and keep the state index.
  async function renderActiveQuestion(ctx, index) {
    if (!activeQuestion) {
      return ctx.answerCbQuery('Question expired or not found');
    }
    activeQuestion.index = index;
    const card = formatQuestionCard(activeQuestion.questions, activeQuestion.answers, index);
    // A Markdown parse error must never stop the card. The first edit is
    // formatted; if Telegram rejects it, retry as plain text so the user still
    // advances. "message is not modified" means nothing changed - not a fault.
    try {
      await ctx.editMessageText(card.text, {
        parse_mode: 'Markdown',
        reply_markup: card.reply_markup
      });
    } catch (err) {
      if (/message is not modified/i.test(err.message)) {
        return ctx.answerCbQuery();
      }
      try {
        await ctx.editMessageText(card.text, { reply_markup: card.reply_markup });
      } catch (retryErr) {
        if (!/message is not modified/i.test(retryErr.message)) {
          console.warn('⚠️ Question card update failed:', retryErr.message);
        }
      }
    }
    return ctx.answerCbQuery();
  }

  async function submitAnswers(ctx) {
    const question = activeQuestion;
    activeQuestion = null;
    const counterAtStart = questionEventCounter;
    startTyping(ctx.chat?.id);

    const keys = buildAnswerKeys(question.questions, question.answers);
    const sent = await io.sendKeys(activeTarget, keys, 300);
    if (sent.accepted === false) {
      stopTyping();
      await ctx.answerCbQuery('Send failed');
      await ctx.reply('⚠️ The terminal did not accept the answer. Nothing was sent.');
      return;
    }

    const ok = await ensureModalSubmitted(activeTarget, counterAtStart);
    if (ok) {
      await ctx.answerCbQuery('Submitted answers');
      await ctx.reply('📨 Answers submitted to Claude.');
    } else {
      stopTyping();
      await ctx.answerCbQuery('Submit failed');
      await ctx.reply(
        '⚠️ Could not confirm the answer in the terminal. The question may still be open there.'
      );
    }
  }

  bot.action(/qa:(\d+):(\d+)/, async (ctx) => {
    const qi = parseInt(ctx.match[1], 10);
    const oi = parseInt(ctx.match[2], 10);
    if (!activeQuestion) {
      return ctx.answerCbQuery('Question expired or not found');
    }
    const question = activeQuestion.questions[qi];
    if (!question || !question.options[oi]) {
      return ctx.answerCbQuery('Option not found');
    }

    if (question.multiSelect) {
      const sel = activeQuestion.answers.get(qi) || new Set();
      if (sel.has(oi)) {
        sel.delete(oi);
      } else {
        sel.add(oi);
      }
      activeQuestion.answers.set(qi, sel);
      // Stay on this page; the card shows a Next or Submit button.
      return renderActiveQuestion(ctx, qi);
    }

    activeQuestion.answers.set(qi, new Set([oi]));
    const isLast = qi === activeQuestion.questions.length - 1;

    // Single-choice answers advance to the next question one page at a time.
    if (!isLast) {
      return renderActiveQuestion(ctx, qi + 1);
    }

    // Pure single-choice sets submit as soon as the last question is answered.
    const allSingleChoice = activeQuestion.questions.every(q => !q.multiSelect);
    if (!allSingleChoice) {
      // An earlier multi-select page needs an explicit Submit tap.
      return renderActiveQuestion(ctx, qi);
    }

    if (!activeTarget) {
      return ctx.answerCbQuery('No active session');
    }
    if (!(await ensureSessionAlive(ctx))) return;
    await submitAnswers(ctx);
  });

  // "▶ Next" on a multi-select page that is not the last question.
  bot.action(/qn:(\d+)/, async (ctx) => {
    const next = parseInt(ctx.match[1], 10);
    if (!activeQuestion) {
      return ctx.answerCbQuery('Question expired or not found');
    }
    if (!activeQuestion.questions[next]) {
      return ctx.answerCbQuery('Question not found');
    }
    return renderActiveQuestion(ctx, next);
  });

  bot.action('submit_q', async (ctx) => {
    if (!activeTarget) {
      return ctx.answerCbQuery('No active session');
    }
    if (!activeQuestion) {
      return ctx.answerCbQuery('No active question to submit');
    }
    const anyAnswered = [...activeQuestion.answers.values()].some(s => s.size > 0);
    if (!anyAnswered) {
      return ctx.answerCbQuery('Please select at least one option');
    }
    if (!(await ensureSessionAlive(ctx))) return;
    await submitAnswers(ctx);
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
      if (!activeTarget) {
        return ctx.reply('⚠️ No active Claude session. Use /projects to start one.');
      }
      if (!(await ensureSessionAlive(ctx))) return;
      startTyping(ctx.chat.id);
      const answer = await io.sendText(activeTarget, fullCommand, true);
      if (!answer.accepted) {
        stopTyping();
        return ctx.reply(NOT_ACCEPTED);
      }
      return ctx.reply(`⚡ Injected \`${fullCommand}\` into \`${targetLabel(activeTarget)}\``, { parse_mode: 'Markdown' });
    }

    // Direct slash command execution (e.g. /clear, /npm_package_flow, /context7_cli, etc.)
    if (text.startsWith('/')) {
      const parts = text.trim().split(/\s+/);
      const cmdRaw = parts[0].slice(1); // remove leading '/'
      const args = parts.slice(1).join(' ');

      // Check if command matches our mapped commands
      const matchedSkill = commandMapping.get(cmdRaw.toLowerCase());
      if (matchedSkill) {
        if (!activeTarget) {
          return ctx.reply('⚠️ No active Claude session. Use /projects to start one first.');
        }
        if (!(await ensureSessionAlive(ctx))) return;
        // A bare choice builtin (/effort, /model) means "open the level picker",
        // not a malformed Claude command; the picker injects the real command on tap.
        if (!args && Array.isArray(matchedSkill.choices) && matchedSkill.choices.length) {
          const view = buildSkillInspectView(matchedSkill);
          return ctx.reply(view.text, { parse_mode: 'Markdown', reply_markup: view.reply_markup });
        }
        const fullCmd = args ? `${matchedSkill.command} ${args}` : matchedSkill.command;
        const answer = await io.sendText(activeTarget, fullCmd, true);
        if (!answer.accepted) {
          return ctx.reply(NOT_ACCEPTED);
        }
        return ctx.reply(`⚡ Injected \`${fullCmd}\` into \`${targetLabel(activeTarget)}\``, { parse_mode: 'Markdown' });
      }
    }

    if (!activeTarget) {
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
      await switchActiveSession(tmuxTarget(sessionName, proj?.path), ctx.chat.id, proj?.path);
      await ctx.reply(`🎯 Auto-connected to active session: \`${sessionName}\``, { parse_mode: 'Markdown' });
    }

    // Conversational text gets the prefix so the transcript (and Claude) can
    // tell Telegram prompts apart from locally typed ones. Slash passthrough stays raw.
    if (!(await ensureSessionAlive(ctx))) return;
    const injectText = text.startsWith('/') ? text : `Telegram user: ${text}`;
    startTyping(ctx.chat.id);
    const answer = await io.sendText(activeTarget, injectText, true);
    // A refusal is not an error: the tab is up but did not take the write, and
    // bytesWritten is 0. Say so instead of leaving the indicator running.
    if (!answer.accepted) {
      stopTyping();
      return ctx.reply(NOT_ACCEPTED);
    }
  });

  return {
    bot,
    switchActiveSession,
    listProjectTabs,
    refreshSkills,
    async attachExistingSession(chatId) {
      const sessions = await tmux.listSessions('claude-');
      if (sessions.length !== 1) return null;
      const sessionName = sessions[0];
      const project = await projectManager.findProjectBySession(sessionName);
      await switchActiveSession(tmuxTarget(sessionName, project?.path), chatId, project?.path);
      return sessionName;
    },
    getActiveState: () => ({
      // Derived, not stored: the tmux session name the pre-target callers read.
      activeSessionName: activeTarget?.kind === 'tmux' ? activeTarget.sessionName : null,
      target: activeTarget,
      activeChatId,
      activeProjectPath,
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
