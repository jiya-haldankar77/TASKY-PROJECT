import { defineStore } from 'pinia';

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    events: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    getHeaders() {
      // Authentication removed for testing
      return { 'Content-Type': 'application/json' };
    },

    async fetchCalendarData(start?: string, end?: string, projectId?: number) {
      this.loading = true;
      try {
        const query = start && end ? `?start=${start}&end=${end}` : '';
        const projectFilter = projectId ? `&project_id=${projectId}` : '';

        // Fetch in parallel
        const [taskRes, availRes, leaveRes] = await Promise.all([
          fetch(`http://localhost:3001/api/pm/calendar/tasks${query}${projectFilter}`, {
            headers: this.getHeaders(),
          }),
          fetch(`http://localhost:3001/api/pm/calendar/availability${query}`, {
            headers: this.getHeaders(),
          }),
          fetch(`http://localhost:3001/api/pm/calendar/leave${query}`, {
            headers: this.getHeaders(),
          }),
        ]);

        const taskData = await taskRes.json();
        const availData = await availRes.json();
        const leaveData = await leaveRes.json();

        const allEvents = [];
        if (taskData.success) {
          // Flatten extendedProps into main event object, but preserve start/end
          const flattenedTasks = taskData.events.map((event: any) => ({
            ...event,
            ...event.extendedProps,
            start: event.start, // Preserve original start
            end: event.end, // Preserve original end
          }));
          allEvents.push(...flattenedTasks);
        }
        if (availData.success) allEvents.push(...availData.events);
        if (leaveData.success) allEvents.push(...leaveData.events);

        this.events = allEvents;
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
