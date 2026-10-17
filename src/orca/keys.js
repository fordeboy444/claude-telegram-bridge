export const ORCA_KEY_BYTES = Object.freeze({
  Enter: '\r',
  Escape: '\x1B',
  Right: '\x1B[C',
  Down: '\x1B[B',
  Space: ' ',
});

/**
 * Maps a tmux key name to Orca pty bytes.
 *
 * @param {string} name
 * @returns {string | null}
 */
export function keyToBytes(name) {
  if (ORCA_KEY_BYTES[name]) {
    return ORCA_KEY_BYTES[name];
  }

  if (/^[1-9]$/.test(name)) {
    return name;
  }

  return null;
}
