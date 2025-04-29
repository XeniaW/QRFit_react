// Advisor util
export const formatDurationWithSeconds = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}min ${seconds}s`;
};

export const formatDate = (timestampSeconds: number): string => {
  const date = new Date(timestampSeconds * 1000);
  return date.toLocaleDateString();
};

/**
 * Calculates the longest streak of consecutive days from an array of UNIX timestamps (in seconds).
 */
export const calculateLongestStreak = (sessionDates: number[]): number => {
  if (sessionDates.length === 0) return 0;

  sessionDates.sort((a, b) => a - b);

  let longestStreak = 1;
  let currentStreak = 1;
  let lastDate: Date | null = null;

  for (const timestamp of sessionDates) {
    const currentDate = new Date(timestamp * 1000);
    if (lastDate !== null) {
      const diffDays =
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1.5) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    }
    lastDate = currentDate;
  }

  return longestStreak;
};
