import { DailyStreak } from "./types";

export function getMissedWeekdays(lastStr: string, todayStr: string): number {
  const today = new Date(todayStr); // Parses YYYY-MM-DD as UTC midnight
  let missed = 0;
  
  // Clone the date immediately
  const d = new Date(lastStr);
  d.setUTCDate(d.getUTCDate() + 1);
  
  while (d < today) {
    const day = d.getUTCDay(); // 0 is Sunday, 6 is Saturday
    if (day !== 0 && day !== 6) {
      missed++;
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return missed;
}

export function calculateStreakStatus(streak: DailyStreak | null): { current: number; inGrace: boolean } {
  if (!streak) return { current: 0, inGrace: false };
  if (!streak.last_completed_date) return { current: streak.current_streak, inGrace: false };

  const todayStr = new Date().toISOString().split("T")[0];
  if (streak.last_completed_date === todayStr) {
    return { current: streak.current_streak, inGrace: false };
  }

  const missed = getMissedWeekdays(streak.last_completed_date, todayStr);
  
  if (missed === 0) {
    return { current: streak.current_streak, inGrace: false };
  } else if (missed === 1) {
    return { current: streak.current_streak, inGrace: true };
  } else {
    return { current: 0, inGrace: false };
  }
}
