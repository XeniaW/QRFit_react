// Simple wrapper around localStorage to track a running workout
const ACTIVE_WORKOUT_KEY = 'activeWorkout';

export interface ActiveWorkout {
  start: number;
}

export function saveActiveWorkout(start: number): void {
  localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify({ start }));
}

export function getActiveWorkout(): ActiveWorkout | null {
  const item = localStorage.getItem(ACTIVE_WORKOUT_KEY);
  return item ? JSON.parse(item) : null;
}

export function clearActiveWorkout(): void {
  localStorage.removeItem(ACTIVE_WORKOUT_KEY);
}
