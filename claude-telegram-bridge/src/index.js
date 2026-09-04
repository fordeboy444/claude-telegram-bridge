import { Telegraf } from 'telegraf';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadConfig } from './config.js';
import { createAuthMiddleware } from './auth.js';
import { TmuxController } from './tmux/controller.js';
import { TmuxMonitor } from './tmux/monitor.js';
import { ClaudeSessionReader } from './tmux/session_reader.js';
import { formatQuestionCard } from './tmux/question_handler.js';
import { cleanTerminalOutput } from './tmux/formatter.js';
import { splitTelegramMessage } from './utils/telegram_chunker.js';
import { scanSkills, getBuiltInCommands } from './skills/scanner.js';
import { buildSkillsKeyboard, buildSkillInspectView } from './skills/menu.js';
import { ProjectManager } from './projects/manager.js';
import { buildProjectsMenu, buildProjectActionView } from './projects/menu.js';

export function createBot(config, deps = {}) {
  const bot = deps.bot || new Telegraf(config.botToken);
  const tmux = deps.tmux || new TmuxController(config.tmuxPath);
  const projectManager = deps.projectManager || new ProjectManager(config.projectsDir, tmux);

  // State tracking
  let activeSessionName = null;
  let activeChatId = null;
  let activeMonitor = null;
  let activeSessionReader = null;
  let pendingArgsSkill = null;
  let cachedSkills = [];

  // Register bot commands
  bot.telegram.setMyCommands([
    { command: 'projects', description: 'Manage project folders & launch sessions' },
    { command: 'skills', description: 'Browse and run Claude skills' },
    { command: 'status', description: 'View current active session' },
    { command: 'help', description: 'Help & usage guide' }
  ]).catch(() => {});

  async function refreshSkills() {
    const localSkillsDir = path.join(process.cwd(), '.claude', 'skills');
    const userSkillsDir = path.join(os.homedir(), '.claude', 'skills');
    const projectSkillsDir = activeSessionName
      ? path.join(config.projectsDir, activeSessionName.replace(/^claude-/, ''), '.claude', 'skills')
      : null;

    const dirs = [localSkillsDir, userSkillsDir, projectSkillsDir].filter(Boolean);
    const scanned = await scanSkills(dirs);
    const builtins = getBuiltInCommands();
    cachedSkills = [...builtins, ...scanned];
    return cachedSkills;
  }

  // Attach Whitelist Auth Guard
  bot.use(createAuthMiddleware(config.allowedUserIds));

  function switchActiveSession(sessionName, chatId, projectPath) {
    if (activeSessionReader) {
      activeSessionReader.stop();
      activeSessionReader = null;
    }
    if (activeMonitor) {
      activeMonitor.stop();
      activeMonitor = null;
    }

    activeSessionName = sessionName;
    activeChatId = chatId;

    if (sessionName && chatId) {
      const resolvedProjectName = sessionName.replace(/^claude-/, '');
      const resolvedProjectPath = projectPath || path.join(config.projectsDir, resolvedProjectName);

      activeSessionReader = new ClaudeSessionReader();
      activeSessionReader.start(
        resolvedProjectPath,
        async (event) => {
          if (!activeChatId) return;
          if (event.type === 'text' && event.content) {
            // Send assistant text from session_reader as clean markdown text rather than wrapping in code fences (```)
            const chunks = splitTelegramMessage(event.content, 4000);
            for (const c of chunks) {
              try {
                await bot.telegram.sendMessage(activeChatId, c, {
                  parse_mode: 'Markdown'
                });
              } catch {
                try {
                  await bot.telegram.sendMessage(activeChatId, c);
                } catch {}
              }
            }
          } else if (event.type === 'question' && event.content) {
            const card = formatQuestionCard(event.content);
            try {
              await bot.telegram.sendMessage(activeChatId, card.text, {
                parse_mode: 'Markdown',
                reply_markup: card.reply_markup
              });
            } catch {
              try {
                await bot.telegram.sendMessage(activeChatId, card.text);
              } catch {}
            }
          }
        },
        config.pollIntervalMs
      );

      // Only start activeMonitor as fallback when no JSONL file is available or ClaudeSessionReader is not handling active output.
      // To avoid simultaneous duplicate message sending when session reader is active, we can check if session reader finds a file or start monitor with fallback logic.
      // Let's check if session reader finds latest file or start TmuxMonitor conditionally / with debounced check.
      // Actually, standard fallback: if session reader runs, we only start TmuxMonitor if no jsonl session file is detected after 2 seconds, OR we run TmuxMonitor without sessionReader or let sessionReader take primary.
      // Per prompt instructions: "Avoid simultaneous duplicate message sending: only start `activeMonitor` if `ClaudeSessionReader` is not active or as a fallback when no JSONL file is available."

      activeSessionReader.findLatestSessionFile(resolvedProjectPath).then(latestFile => {
        if (!latestFile && activeSessionName === sessionName && activeChatId === chatId) {
          // Fallback monitor when no JSONL file is available
          activeMonitor = new TmuxMonitor(tmux, sessionName, config.pollIntervalMs);
          let pendingOutput = '';
          let debounceTimer = null;

          activeMonitor.start((chunk) => {
            const cleaned = cleanTerminalOutput(chunk);
            if (!cleaned) return;
            pendingOutput += (pendingOutput ? '\n' : '') + cleaned;
            if (!debounceTimer) {
              debounceTimer = setTimeout(async () => {
                const textToSend = pendingOutput.trim();
                pendingOutput = '';
                debounceTimer = null;
                if (!textToSend || !activeChatId) return;

                const chunks = splitTelegramMessage(textToSend, 4000);
                for (const c of chunks) {
                  try {
                    await bot.telegram.sendMessage(activeChatId, `\`\`\`\n${c}\n\`\`\``, {
                      parse_mode: 'Markdown'
                    });
                  } catch {
                    try {
                      await bot.telegram.sendMessage(activeChatId, c);
                    } catch {}
                  }
                }
              }, 1500);
            }
          });
        }
      });
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
    switchActiveSession(sessionName, ctx.chat.id, proj ? proj.path : null);
    await ctx.reply(
      `🚀 *Fresh session started!*\nFocused on: \`${sessionName}\`\nSend any text message to interact.`,
      { parse_mode: 'Markdown' }
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
    if (activeSessionName) {
      await tmux.sendKeys(activeSessionName, optionNumber, true);
      await ctx.answerCbQuery(`Selected option ${optionNumber}`);
      await ctx.reply(`Selected option ${optionNumber}`);
    } else {
      await ctx.answerCbQuery('No active session');
    }
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
      await tmux.sendKeys(activeSessionName, fullCommand, true);
      return ctx.reply(`⚡ Injected \`${fullCommand}\` into \`${activeSessionName}\``, { parse_mode: 'Markdown' });
    }

    if (!activeSessionName) {
      return ctx.reply(
        '⚪ *No active Claude Code session connected.*\nUse /projects to select a project and start a session.',
        { parse_mode: 'Markdown' }
      );
    }

    await tmux.sendKeys(activeSessionName, text, true);
  });

  return {
    bot,
    switchActiveSession,
    refreshSkills,
    getActiveState: () => ({
      activeSessionName,
      activeChatId,
      pendingArgsSkill
    }),
    stop: () => {
      if (activeSessionReader) {
        activeSessionReader.stop();
        activeSessionReader = null;
      }
      if (activeMonitor) {
        activeMonitor.stop();
        activeMonitor = null;
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
