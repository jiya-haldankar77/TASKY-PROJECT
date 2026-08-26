import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';
const apiBase = 'http://localhost:3001/api/pm/calendar';

export const useCalendarStore = defineStore('calendar', {
  state: () => ({ events: [] as any[], loading: false, error: null as string | null, requestId: 0 }),
  actions: {
    getHeaders() { return { Authorization: `Bearer ${useAuthStore().token}` }; },
    async fetchCalendarData(start?: string, end?: string) {
      const requestId = ++this.requestId; this.loading = true; this.error = null;
      const query = start && end ? `?${new URLSearchParams({ start, end }).toString()}` : '';
      try {
        const responses = await Promise.all(['tasks', 'availability', 'leave'].map(path => fetch(`${apiBase}/${path}${query}`, { headers: this.getHeaders() })));
        const payloads = await Promise.all(responses.map(async response => {
          let data: any; try { data = await response.json(); } catch { data = null; }
          if (!response.ok || !data?.success) throw new Error(data?.error || `Request failed (${response.status})`);
          return data;
        }));
        if (requestId === this.requestId) this.events = payloads.flatMap(data => data.events || []);
      } catch (error: any) { if (requestId === this.requestId) this.error = error.message; }
      finally { if (requestId === this.requestId) this.loading = false; }
    },
  },
});
