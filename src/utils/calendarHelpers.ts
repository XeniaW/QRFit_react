// Format date as YYYY-MM-DD in local time
export const formatLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Determine cycle phase by day index
export const getPhaseForDay = (
  day: number,
  cycleLength: number,
  periodLength: number
) => {
  const ovulationDay = cycleLength - 14;
  if (day >= 1 && day <= periodLength) return 'menstruation';
  if (day === ovulationDay) return 'ovulation';
  return null; // hide follicular/luteal
};
