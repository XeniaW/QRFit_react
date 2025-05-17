// Uses the SW’s showNotification API to post a non-dismissable (requireInteraction) notice
const NOTIFICATION_TAG = 'active-workout';

export async function requestNotificationPermission(): Promise<void> {
  if (Notification.permission !== 'granted') {
    await Notification.requestPermission();
  }
}

export async function showWorkoutNotification(startTs: number): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  registration.showNotification('Workout in progress', {
    body: `Started at ${new Date(startTs).toLocaleTimeString()}`,
    tag: NOTIFICATION_TAG,
    requireInteraction: true,
  });
}

export async function clearWorkoutNotification(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const notifications = await registration.getNotifications({
    tag: NOTIFICATION_TAG,
  });
  notifications.forEach(n => n.close());
}
