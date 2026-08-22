export interface Employee {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  progress: number;
  priority: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  employeeId?: string;
  status: string; // 'pending', 'in_progress', 'review', 'completed'
  priority: string; // 'low', 'medium', 'high', 'critical'
  deadline: string;
  expectedEffort: number;
  progress: number;
  assignedResources?: string[];
  dependencies?: string[];
}

export interface WorkLog {
  id: string;
  taskId: string;
  employeeId: string;
  date: string;
  hours: number;
  notes: string;
  status: string;
  hoursSpent: number;
  previousProgress: number;
  newProgress: number;
  workCompleted: string;
  remainingWork: string;
  comments: string;
}

export const mockEmployees: Employee[] = [
  { id: 'emp-1', name: 'Sarah Johnson', role: 'Frontend Dev', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: 'emp-2', name: 'Michael Chen', role: 'Backend Dev', avatar: 'https://i.pravatar.cc/150?img=2' },
];

export const mockProjects: Project[] = [
  { id: 'proj-1', name: 'Website Redesign', color: '#ff0000', progress: 45, priority: 'high' },
];

export const mockTasks: Task[] = [
  { id: 'task-1', title: 'Design Homepage', description: 'Create homepage mockup', projectId: 'proj-1', employeeId: 'emp-1', status: 'in_progress', priority: 'high', deadline: '2026-09-01', expectedEffort: 40, progress: 50 },
];

export const mockWorkLogs: WorkLog[] = [];
