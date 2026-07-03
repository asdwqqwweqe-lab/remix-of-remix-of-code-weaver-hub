import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Workspace {
  id: string;
  name: { ar: string; en: string };
  emoji: string;
  /** Hex accent — applied as CSS `--primary` HSL override */
  accent: string;
  builtin?: boolean;
}

interface State {
  workspaces: Workspace[];
  activeId: string;
  setActive: (id: string) => void;
  addWorkspace: (w: Omit<Workspace, 'id'>) => void;
  updateWorkspace: (id: string, patch: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
}

const DEFAULT: Workspace[] = [
  { id: 'personal', name: { ar: 'شخصي', en: 'Personal' }, emoji: '🏠', accent: '#14b8a6', builtin: true },
  { id: 'work',     name: { ar: 'عمل',   en: 'Work' },     emoji: '💼', accent: '#3b82f6', builtin: true },
  { id: 'study',    name: { ar: 'دراسة', en: 'Study' },    emoji: '📚', accent: '#a855f7', builtin: true },
];

export const useWorkspaceStore = create<State>()(
  persist(
    (set) => ({
      workspaces: DEFAULT,
      activeId: 'personal',
      setActive: (id) => set({ activeId: id }),
      addWorkspace: (w) =>
        set((s) => ({ workspaces: [...s.workspaces, { ...w, id: crypto.randomUUID() }] })),
      updateWorkspace: (id, patch) =>
        set((s) => ({
          workspaces: s.workspaces.map(w => w.id === id ? { ...w, ...patch } : w),
        })),
      removeWorkspace: (id) =>
        set((s) => ({
          workspaces: s.workspaces.filter(w => w.id !== id && !(w.id === id && w.builtin)),
          activeId: s.activeId === id ? 'personal' : s.activeId,
        })),
    }),
    { name: 'workspaces-v1' },
  ),
);

/** Convert #rrggbb → "H S% L%" for Tailwind `hsl(var(--primary))`. */
export function hexToHslString(hex: string): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return '180 60% 45%';
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
