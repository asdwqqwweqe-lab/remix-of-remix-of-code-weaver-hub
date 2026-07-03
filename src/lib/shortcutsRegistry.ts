// Custom shortcut registry — user-defined keyboard shortcuts.
// Storage in localStorage; global listener bound once.

export type ShortcutAction =
  | { type: 'navigate'; path: string }
  | { type: 'toast'; message: string };

export interface CustomShortcut {
  id: string;
  keys: string;        // "Ctrl+Shift+N" (normalized)
  label: string;
  action: ShortcutAction;
  enabled: boolean;
}

const KEY = 'custom-shortcuts-v1';

export const loadShortcuts = (): CustomShortcut[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};
export const saveShortcuts = (list: CustomShortcut[]) => {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('custom-shortcuts-updated'));
};

export function normalizeCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) parts.push(key);
  return parts.join('+');
}
