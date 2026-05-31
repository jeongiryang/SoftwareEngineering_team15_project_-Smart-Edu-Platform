export const INTRO_AUTO_PLAY_STORAGE_KEY = 'sagakIntroAutoPlayEnabled';

export function readIntroAutoPlayEnabled() {
  try {
    return globalThis.localStorage?.getItem(INTRO_AUTO_PLAY_STORAGE_KEY) !== 'false';
  } catch (error) {
    return true;
  }
}

export function saveIntroAutoPlayEnabled(enabled) {
  try {
    globalThis.localStorage?.setItem(INTRO_AUTO_PLAY_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    // Local storage is optional; the current header state still updates immediately.
  }
}
