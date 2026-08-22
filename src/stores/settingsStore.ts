import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: null as any,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    getHeaders() {
      const auth = useAuthStore();
      return { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}` 
      };
    },

    async fetchSettings() {
      this.loading = true;
      try {
        const response = await fetch('http://localhost:3001/api/pm/settings', {
          headers: this.getHeaders(),
        });
        const data = await response.json();
        if (data.success) {
          this.settings = data.settings;
        }
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async updateSettings(updates: any) {
      try {
        const response = await fetch('http://localhost:3001/api/pm/settings', {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        });
        const data = await response.json();
        if (data.success) {
          this.settings = data.settings;
          return true;
        }
        throw new Error(data.error);
      } catch (err: any) {
        throw err;
      }
    },

    async changePassword(currentPassword: string, newPassword: string) {
      try {
        const response = await fetch('http://localhost:3001/api/pm/settings/password', {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        return true;
      } catch (err: any) {
        throw err;
      }
    }
  },
});
