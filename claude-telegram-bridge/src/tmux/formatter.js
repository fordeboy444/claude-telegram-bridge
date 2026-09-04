const ANSI_REGEX = new RegExp(
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  'g'
);

export function cleanAnsi(text) {
  if (!text) return '';
  return text
    .replace(ANSI_REGEX, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');
}

export function formatTerminalOutput(rawText) {
  const cleaned = cleanAnsi(rawText);
  return cleaned.trim();
}

export function cleanTerminalOutput(rawText) {
  if (!rawText) return '';
  const cleaned = cleanAnsi(rawText);
  const lines = cleaned.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true; // keep blank lines or let trim handle it
    // Filter box-drawing characters
    if (/^[─━═┄┅┈┉┌┐└┘├┤┬┴┼╭╮╯╰│┃]+$/.test(trimmed)) {
      return false;
    }
    // Filter Claude CLI banner / version headers
    if (/Claude Code\s+v?\d+\.\d+/i.test(trimmed)) {
      return false;
    }
    // Filter prompt lines
    if (/^❯\s*(describe a task|ask a question|\.\.\.)?/i.test(trimmed)) {
      return false;
    }
    // Filter footer lines
    if (/^\?\s+for help\s+·/i.test(trimmed) || /Ctrl\+[A-Z]/i.test(trimmed)) {
      return false;
    }
    return true;
  });
  return filtered.join('\n').trim();
}

