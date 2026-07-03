// SM-2 spaced repetition algorithm
// Quality: 0=Again, 3=Hard, 4=Good, 5=Easy

export interface SchedulingState {
  ease: number;         // >= 1.3
  interval: number;     // days
  repetitions: number;
  dueDate: number;      // epoch ms
}

export const initialState = (): SchedulingState => ({
  ease: 2.5,
  interval: 0,
  repetitions: 0,
  dueDate: Date.now(),
});

export function schedule(prev: SchedulingState, quality: 0 | 3 | 4 | 5): SchedulingState {
  let { ease, interval, repetitions } = prev;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * ease);
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }

  const dueDate = Date.now() + interval * 86400000;
  return { ease, interval, repetitions, dueDate };
}
