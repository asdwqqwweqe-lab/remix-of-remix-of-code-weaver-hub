const KEY = 'studyStreak.v1';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // YYYY-MM-DD
  activeDays: string[]; // YYYY-MM-DD list
  achievements: number[]; // milestone thresholds unlocked (3,7,30,100)
}

const MILESTONES = [3, 7, 30, 100];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, activeDays: [], achievements: [] };
}

function save(data: StreakData) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('streak:changed', { detail: data }));
}

/** Call whenever the user completes a topic / meaningful learning action. */
export function recordActivity(): { data: StreakData; newAchievement: number | null } {
  const data = getStreak();
  const today = todayKey();
  if (data.lastActivityDate === today) {
    return { data, newAchievement: null };
  }
  if (data.lastActivityDate) {
    const diff = daysBetween(data.lastActivityDate, today);
    data.currentStreak = diff === 1 ? data.currentStreak + 1 : 1;
  } else {
    data.currentStreak = 1;
  }
  data.lastActivityDate = today;
  data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
  if (!data.activeDays.includes(today)) data.activeDays.push(today);
  // trim to 120 days
  data.activeDays = data.activeDays.slice(-120);
  let newAchievement: number | null = null;
  for (const m of MILESTONES) {
    if (data.currentStreak >= m && !data.achievements.includes(m)) {
      data.achievements.push(m);
      newAchievement = m;
    }
  }
  save(data);
  return { data, newAchievement };
}
