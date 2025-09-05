export type CalendarEvent = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: Date;
  time?: string | null;
  type: string;
  noteId?: string | null;
  duration: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Module-level singleton store (ephemeral; resets on redeploy). Parity with Express in-memory demo.
const store: { events: CalendarEvent[] } = {
  events: [],
};

export function getUserEvents(userId: string): CalendarEvent[] {
  return store.events.filter((e) => e.userId === userId);
}

export function addEvent(event: CalendarEvent): void {
  store.events.push(event);
}

export function findEventById(id: string, userId: string): CalendarEvent | undefined {
  return store.events.find((e) => e.id === id && e.userId === userId);
}

export function updateEvent(
  id: string,
  userId: string,
  updates: Partial<CalendarEvent>
): CalendarEvent | null {
  const idx = store.events.findIndex((e) => e.id === id && e.userId === userId);
  if (idx === -1) return null;
  store.events[idx] = { ...store.events[idx], ...updates, updatedAt: new Date() };
  return store.events[idx];
}

export function deleteEvent(id: string, userId: string): boolean {
  const before = store.events.length;
  const remaining = store.events.filter((e) => !(e.id === id && e.userId === userId));
  store.events.length = 0;
  store.events.push(...remaining);
  return remaining.length !== before;
}

export function getEventsInRange(userId: string, start: Date, end: Date): CalendarEvent[] {
  return store.events.filter((e) => e.userId === userId && e.date >= start && e.date <= end);
}