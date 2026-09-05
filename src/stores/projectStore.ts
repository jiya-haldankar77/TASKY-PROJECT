import { defineStore } from 'pinia';

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [] as any[],
    currentProject: null as any | null,
    currentProjectTimeline: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    activeProjects: (state) => state.projects.filter((p) => p.status === 'active'),
    atRiskProjects: (state) => state.projects.filter((p) => p.overdue_task_count > 0),
  },

  actions: {
    getHeaders() {
      // Authentication removed for testing
      return {
        'Content-Type': 'application/json',
      };
    },

    async fetchProjects(filters = {}) {
      this.loading = true;
      try {
        const queryParams = new URLSearchParams(filters as any).toString();
        const response = await fetch(`http://localhost:3001/api/pm/projects?${queryParams}`, {
          headers: this.getHeaders(),
        });
        const data = await response.json();
        if (data.success) {
          this.projects = data.projects;
        } else {
          this.error = data.error;
        }
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchProjectById(id: string) {
      this.loading = true;
      try {
        const response = await fetch(`http://localhost:3001/api/pm/projects/${id}`, {
          headers: this.getHeaders(),
        });
        const data = await response.json();
        if (data.success) {
          this.currentProject = data.project;
        } else {
          this.error = data.error;
        }
      } catch (err: any) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchProjectTimeline(id: string) {
      try {
        const response = await fetch(`http://localhost:3001/api/pm/projects/${id}/timeline`, {
          headers: this.getHeaders(),
        });
        const data = await response.json();
        if (data.success) {
          this.currentProjectTimeline = data.timeline || [];
        }
      } catch (err) {
        console.error('Error fetching project timeline:', err);
      }
    },

    async createProject(projectData: any) {
      try {
        const response = await fetch('http://localhost:3001/api/pm/projects', {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(projectData),
        });
        const data = await response.json();
        if (data.success) {
          this.projects.unshift(data.project);
          return data.project;
        }
        throw new Error(data.error);
      } catch (err: any) {
        throw err;
      }
    },

    async updateProject(id: string, updates: any) {
      try {
        const response = await fetch(`http://localhost:3001/api/pm/projects/${id}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        });
        const data = await response.json();
        if (data.success) {
          const index = this.projects.findIndex((p) => p.id == id);
          if (index !== -1) {
            this.projects[index] = { ...this.projects[index], ...data.project };
          }
          if (this.currentProject && this.currentProject.id == id) {
            this.currentProject = { ...this.currentProject, ...data.project };
          }
          return data.project;
        }
        throw new Error(data.error);
      } catch (err: any) {
        throw err;
      }
    },

    async deleteProject(id: string) {
      try {
        const response = await fetch(`http://localhost:3001/api/pm/projects/${id}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        });
        const data = await response.json();
        if (data.success) {
          this.projects = this.projects.filter((p) => p.id != id);
          if (this.currentProject && this.currentProject.id == id) {
            this.currentProject = null;
          }
          return true;
        }
        throw new Error(data.error);
      } catch (err: any) {
        throw err;
      }
    },

    async refresh() {
      await this.fetchProjects();
    },
  },
});
