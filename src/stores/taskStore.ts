import { defineStore } from 'pinia';
import { mockEmployees, mockProjects, mockTasks, mockWorkLogs, type Employee, type Project, type Task, type WorkLog } from '@/data/mockData';

export const useTaskStore = defineStore('taskStore', {
  state: () => ({
    currentRole: 'pm',
    currentEmployeeId: 'emp-1',
    employees: [...mockEmployees],
    projectsList: [...mockProjects],
    tasks: [...mockTasks],
    workLogs: [...mockWorkLogs],
  }),
  getters: {
    currentEmployee: (state) => state.employees.find((e: Employee) => e.id === state.currentEmployeeId) || state.employees[0],
    employeeAnalytics: (state) => {
      const empTasks = state.tasks.filter((t: Task) => t.employeeId === state.currentEmployeeId);
      const completed = empTasks.filter((t: Task) => t.status === 'completed').length;
      return {
        totalTasks: empTasks.length,
        completedTasks: completed,
        pendingTasks: empTasks.length - completed,
        hoursLogged: state.workLogs.filter((l: WorkLog) => l.employeeId === state.currentEmployeeId).reduce((acc: number, log: WorkLog) => acc + log.hours, 0),
        dailyUpdatePending: false,
        inProgressTasks: empTasks.filter((t: Task) => t.status === 'in_progress').length,
        isOverloaded: false,
        workload: 50,
        overdueTasks: 0,
        upcomingDeadlines: [] as { task: Task; daysUntil: number }[]
      };
    }
  },
  actions: {
    switchRole(role: 'pm' | 'employee', empId?: string) {
      this.currentRole = role;
      if (empId) this.currentEmployeeId = empId;
    },
    getTasksByEmployee(empId: string) {
      return this.tasks.filter((t: Task) => t.employeeId === empId);
    },
    getWorkLogsByEmployee(empId: string) {
      return this.workLogs.filter((l: WorkLog) => l.employeeId === empId);
    },
    getProjectById(id: string) {
      return this.projectsList.find((p: Project) => p.id === id);
    },
    getTaskById(id: string) {
      return this.tasks.find((t: Task) => t.id === id);
    },
    getEmployeeById(id: string) {
      return this.employees.find((e: Employee) => e.id === id);
    },
    getProgressUpdatesByTask(taskId: string) {
      return this.workLogs.filter((l: WorkLog) => l.taskId === taskId).sort((a: WorkLog, b: WorkLog) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    addTask(taskData: Partial<Task>) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: '',
        description: '',
        projectId: '',
        priority: 'medium',
        deadline: '',
        expectedEffort: 0,
        status: 'pending',
        progress: 0,
        ...taskData,
      };
      this.tasks.push(newTask);
    },
    updateTask(taskId: string, updates: Partial<Task>) {
      const task = this.tasks.find((t: Task) => t.id === taskId);
      if (task) {
        Object.assign(task, updates);
      }
    },
    addWorkLog(logData: Partial<WorkLog>) {
      const newLog: WorkLog = {
        id: `log-${Date.now()}`,
        taskId: '',
        employeeId: '',
        date: '',
        hours: 0,
        notes: '',
        status: '',
        hoursSpent: 0,
        previousProgress: 0,
        newProgress: 0,
        workCompleted: '',
        remainingWork: '',
        comments: '',
        ...logData
      };
      this.workLogs.push(newLog);
    }
  }
});
