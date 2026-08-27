import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  reference_type: string | null;
  reference_id: number | null;
  is_read: number | boolean;
  created_at: string;
}

const API_URL = 'http://localhost:3001/api/notifications';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as Notification[],
    isFetching: false,
    isMarkingAsRead: false,
    isMarkingAllAsRead: false,
    isDeleting: false,
    error: null as string | null,
  }),
  getters: {
    unreadCount: (state) => state.notifications.filter(notification => !notification.is_read).length,
  },
  actions: {
    getHeaders() {
      const auth = useAuthStore();
      return { Authorization: `Bearer ${auth.token}` };
    },
    async request(path = '', options: RequestInit = {}) {
      const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...this.getHeaders(), ...(options.headers || {}) } });
      let data: any;
      try { data = await response.json(); } catch { data = null; }
      if (!response.ok || !data?.success) throw new Error(data?.error || `Request failed (${response.status})`);
      return data;
    },
    async fetchNotifications() {
      this.error = null; this.isFetching = true;
      try { const data = await this.request(); this.notifications = data.notifications as Notification[]; }
      catch (error: any) { this.error = error.message; }
      finally { this.isFetching = false; }
    },
    async markAsRead(id: number) {
      this.error = null; this.isMarkingAsRead = true;
      try { await this.request(`/${id}/read`, { method: 'PUT' }); const notification = this.notifications.find(item => item.id === id); if (notification) notification.is_read = 1; }
      catch (error: any) { this.error = error.message; }
      finally { this.isMarkingAsRead = false; }
    },
    async markAllAsRead() {
      this.error = null; this.isMarkingAllAsRead = true;
      try { await this.request('/read-all', { method: 'PUT' }); this.notifications.forEach(notification => { notification.is_read = 1; }); }
      catch (error: any) { this.error = error.message; }
      finally { this.isMarkingAllAsRead = false; }
    },
    async deleteNotification(id: number) {
      this.error = null; this.isDeleting = true;
      try { await this.request(`/${id}`, { method: 'DELETE' }); this.notifications = this.notifications.filter(notification => notification.id !== id); }
      catch (error: any) { this.error = error.message; }
      finally { this.isDeleting = false; }
    },
  },
});
