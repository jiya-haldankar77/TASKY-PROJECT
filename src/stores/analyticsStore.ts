import { defineStore } from 'pinia';
import { useAuthStore } from './authStore';

const apiBase = 'http://localhost:3001/api/pm/analytics';
type DateRange = { start: string; end: string };

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    overview: null as any, projectProgress: [] as any[], taskDistribution: null as any,
    resourceWorkload: [] as any[], deadlineRisks: [] as any[], projectPerformance: [] as any[], dailyLogCompliance: [] as any[],
    loading: false, error: null as string | null, requestId: 0,
  }),
  actions: {
    getHeaders() { return { Authorization: `Bearer ${useAuthStore().token}` }; },
    async get(path: string, range?: DateRange) {
      const query = range ? `?${new URLSearchParams(range).toString()}` : '';
      const response = await fetch(`${apiBase}/${path}${query}`, { headers: this.getHeaders() });
      let data: any; try { data = await response.json(); } catch { data = null; }
      if (!response.ok || !data?.success) throw new Error(data?.error || `Request failed (${response.status})`);
      return data;
    },
    async fetchOverview(range?: DateRange, requestId?: number) { const activeRequestId = requestId ?? ++this.requestId; try { const data = await this.get('overview', range); if (activeRequestId === this.requestId) this.overview = data.overview; } catch (error: any) { if (activeRequestId === this.requestId) this.error = error.message; } },
    async fetchProjectProgress(range?: DateRange, requestId?: number) { const activeRequestId = requestId ?? ++this.requestId; try { const data = await this.get('project-progress', range); if (activeRequestId === this.requestId) this.projectProgress = data.projects; } catch (error: any) { if (activeRequestId === this.requestId) this.error = error.message; } },
    async fetchTaskDistribution(range?: DateRange, requestId?: number) { const activeRequestId = requestId ?? ++this.requestId; try { const data = await this.get('task-distribution', range); if (activeRequestId === this.requestId) this.taskDistribution = { status: data.statusDistribution, priority: data.priorityDistribution, total: data.total }; } catch (error: any) { if (activeRequestId === this.requestId) this.error = error.message; } },
    async fetchResourceWorkload(range?: DateRange, requestId?: number) { const activeRequestId = requestId ?? ++this.requestId; try { const data = await this.get('resource-workload', range); if (activeRequestId === this.requestId) this.resourceWorkload = data.byProject; } catch (error: any) { if (activeRequestId === this.requestId) this.error = error.message; } },
    async fetchDeadlineRisks(range?: DateRange, requestId?: number) { const activeRequestId = requestId ?? ++this.requestId; try { const data = await this.get('deadline-risks', range); if (activeRequestId === this.requestId) this.deadlineRisks = data.risks; } catch (error: any) { if (activeRequestId === this.requestId) this.error = error.message; } },
    async fetchProjectPerformance(range?: DateRange, requestId?: number) { const activeRequestId = requestId ?? ++this.requestId; try { const data = await this.get('project-performance', range); if (activeRequestId === this.requestId) this.projectPerformance = data.projects; } catch (error: any) { if (activeRequestId === this.requestId) this.error = error.message; } },
    async fetchDailyLogCompliance(range?: DateRange, requestId?: number) { const activeRequestId = requestId ?? ++this.requestId; try { const data = await this.get('daily-log-compliance', range); if (activeRequestId === this.requestId) this.dailyLogCompliance = data.compliance; } catch (error: any) { if (activeRequestId === this.requestId) this.error = error.message; } },
    async loadAll(range?: DateRange) {
      const requestId = ++this.requestId;
      this.loading = true; this.error = null;
      await Promise.all([this.fetchOverview(range, requestId), this.fetchProjectProgress(range, requestId), this.fetchTaskDistribution(range, requestId), this.fetchResourceWorkload(range, requestId), this.fetchDeadlineRisks(range, requestId), this.fetchProjectPerformance(range, requestId), this.fetchDailyLogCompliance(range, requestId)]);
      if (requestId === this.requestId) this.loading = false;
    },
  },
});
