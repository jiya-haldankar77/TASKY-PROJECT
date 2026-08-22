import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';

export const useResourceStore = defineStore('resource', {
  state: () => ({
    resources: [] as any[],
    currentResource: null as any | null,
    conflicts: [] as any[],
    availability: {
      available: [],
      unavailable: [],
      counts: { available: 0, unavailable: 0 }
    },
    loading: false,
    error: null as string | null,
  }),

  getters: {
    overloadedResources: (state) => state.resources.filter(r => r.workload_status === 'overloaded'),
  },

  actions: {
    getHeaders() {
      const auth = useAuthStore();
      return { Authorization: `Bearer ${auth.token}` };
    },

    async fetchResources(search = '') {
      this.loading = true;
      try {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        const response = await fetch(`http://localhost:3001/api/pm/resources${query}`, {
          headers: this.getHeaders(),
        });
        const data = await response.json();
        if (data.success) {
          this.resources = data.resources;
        } else {
          this.error = data.error;
        }
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchResourceById(id: string) {
      this.loading = true;
      try {
        const response = await fetch(`http://localhost:3001/api/pm/resources/${id}`, {
          headers: this.getHeaders(),
        });
        const data = await response.json();
        if (data.success) {
          this.currentResource = data.resource;
        } else {
          this.error = data.error;
        }
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchConflicts() {
      this.loading = true;
      try {
        const response = await fetch('http://localhost:3001/api/pm/resources/conflicts', {
          headers: this.getHeaders(),
        });
        const data = await response.json();
        if (data.success) {
          this.conflicts = data.conflicts;
        } else {
          this.error = data.error;
        }
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchAvailability() {
      this.loading = true;
      try {
        const response = await fetch('http://localhost:3001/api/pm/resources/availability', {
          headers: this.getHeaders(),
        });
        const data = await response.json();
        if (data.success) {
          this.availability = {
            available: data.available,
            unavailable: data.unavailable,
            counts: data.counts
          };
        } else {
          this.error = data.error;
        }
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
