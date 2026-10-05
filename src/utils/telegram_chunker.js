export function splitTelegramMessage(text, maxLength = 4000) {
  if (!text) return [];
  if (text.length <= maxLength) return [text];

  const chunks = [];
  const lines = text.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if (line.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      for (let i = 0; i < line.length; i += maxLength) {
        chunks.push(line.slice(i, i + maxLength));
      }
      continue;
    }

    const testChunk = currentChunk ? `${currentChunk}\n${line}` : line;
    if (testChunk.length <= maxLength) {
      currentChunk = testChunk;
    } else {
      chunks.push(currentChunk);
      currentChunk = line;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
