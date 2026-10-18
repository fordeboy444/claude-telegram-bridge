// claude-telegram-bridge/src/utils/messenger.js
// Telegram sending with a graceful markdown -> plain-text fallback.
// Logs a warning instead of silently swallowing delivery failures so
// breakage is visible in the daemon output.
export async function sendWithFallback(bot, chatId, text, extra = undefined) {
  try {
    return await bot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown', ...extra });
  } catch {
    try {
      return await bot.telegram.sendMessage(chatId, text, extra ? { ...extra } : undefined);
    } catch (err) {
      console.warn(`⚠️ Telegram send failed to chat ${chatId}:`, err.message);
      return null;
    }
  }
}