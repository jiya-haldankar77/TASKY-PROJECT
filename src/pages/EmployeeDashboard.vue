<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4 text-weight-bold">My Dashboard</div>
      <div v-if="currentEmployee" class="row items-center q-gutter-md">
        <q-avatar size="48px">
          <img :src="currentEmployee.avatar" />
        </q-avatar>
        <div>
          <div class="text-subtitle1 text-weight-bold">{{ currentEmployee.name }}</div>
          <div class="text-caption text-grey-7">{{ currentEmployee.role }}</div>
        </div>
      </div>
    </div>

    <!-- Daily Update Pending Warning -->
    <q-card v-if="analytics?.dailyUpdatePending" class="q-mb-md bg-orange-1">
      <q-card-section class="row items-center">
        <q-icon name="warning" color="orange" size="32px" class="q-mr-md" />
        <div>
          <div class="text-h6 text-weight-bold text-orange">Daily Update Pending</div>
          <div class="text-caption">You missed your daily work log entry yesterday. Please submit your update.</div>
        </div>
        <q-space />
        <q-btn color="orange" label="Submit Update" to="/work-log" />
      </q-card-section>
    </q-card>

    <!-- Analytics Cards -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="bg-blue-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">My Tasks</div>
            <div class="text-h4 text-weight-bold text-primary">{{ analytics?.totalTasks || 0 }}</div>
            <div class="text-caption text-grey-6">{{ analytics?.inProgressTasks || 0 }} in progress</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="bg-green-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">Completed</div>
            <div class="text-h4 text-weight-bold text-green">{{ analytics?.completedTasks || 0 }}</div>
            <div class="text-caption text-grey-6">{{ analytics?.totalTasks || 0 }} total</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card :class="analytics?.isOverloaded ? 'bg-red-1' : 'bg-purple-1'">
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">Workload</div>
            <div class="text-h4 text-weight-bold" :class="analytics?.isOverloaded ? 'text-red' : 'text-purple'">
              {{ analytics?.workload?.toFixed(1) || 0 }}h
            </div>
            <div class="text-caption text-grey-6">
              {{ analytics?.isOverloaded ? 'Overloaded' : 'Normal load' }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="bg-orange-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">Overdue</div>
            <div class="text-h4 text-weight-bold text-orange">{{ analytics?.overdueTasks || 0 }}</div>
            <div class="text-caption text-grey-6">Tasks past deadline</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Upcoming Deadlines -->
    <q-card v-if="analytics?.upcomingDeadlines && analytics.upcomingDeadlines.length > 0" class="q-mb-md">
      <q-card-section>
        <div class="text-h6 text-weight-bold">
          <q-icon name="schedule" class="q-mr-sm" />
          Upcoming Deadlines
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-list separator>
          <q-item v-for="item in analytics.upcomingDeadlines" :key="item.task.id">
            <q-item-section avatar>
              <q-avatar :style="{ backgroundColor: getProjectById(item.task.projectId)?.color }" size="32px" text-color="white">
                {{ getProjectById(item.task.projectId)?.name.charAt(0) }}
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.task.title }}</q-item-label>
              <q-item-label caption>
                {{ getProjectById(item.task.projectId)?.name }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge :color="item.daysUntil <= 2 ? 'red' : item.daysUntil <= 5 ? 'orange' : 'yellow'">
                {{ item.daysUntil }} days
              </q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- My Tasks by Project -->
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="text-h6 text-weight-bold">My Tasks Across Projects</div>
              <q-btn color="primary" icon="add" label="Self-Assign Task" @click="showCreateTaskDialog = true" />
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div v-if="myTasks.length === 0" class="text-center q-pa-lg text-grey-6">
              <q-icon name="assignment" size="64px" color="grey-4" />
              <div class="text-h6 q-mt-md">No tasks assigned</div>
              <div class="text-caption">Create a self-assigned task to get started</div>
            </div>
            <q-list v-else separator>
              <q-item v-for="task in myTasks" :key="task.id" clickable @click="showTaskDetail(task)">
                <q-item-section avatar>
                  <q-avatar :style="{ backgroundColor: getProjectById(task.projectId)?.color }" size="32px" text-color="white">
                    {{ getProjectById(task.projectId)?.name.charAt(0) }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ task.title }}</q-item-label>
                  <q-item-label caption>
                    {{ getProjectById(task.projectId)?.name }} • Due: {{ task.deadline }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="column items-end">
                    <q-badge :color="getPriorityColor(task.priority)" class="text-capitalize q-mb-xs">
                      {{ task.priority }}
                    </q-badge>
                    <q-linear-progress :value="task.progress / 100" :color="getProgressColor(task.progress)" style="width: 80px" />
                    <div class="text-caption">{{ task.progress }}%</div>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Recent Work Logs -->
    <q-card class="q-mt-md">
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">Recent Work Logs</div>
          <q-btn flat color="primary" label="View All" to="/work-log" />
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-list separator>
          <q-item v-for="log in recentWorkLogs" :key="log.id">
            <q-item-section avatar>
              <q-icon :name="getLogStatusIcon(log.status)" :color="getLogStatusColor(log.status)" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ getTaskById(log.taskId)?.title }}</q-item-label>
              <q-item-label caption>
                {{ log.date }} • {{ log.hoursSpent }}h spent
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge :color="getLogStatusColor(log.status)" class="text-capitalize">
                {{ log.status.replace('-', ' ') }}
              </q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Create Self-Assigned Task Dialog -->
    <q-dialog v-model="showCreateTaskDialog">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Create Self-Assigned Task</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-form @submit="createSelfAssignedTask">
            <q-input
              v-model="newTask.title"
              label="Task Title"
              outlined
              class="q-mb-md"
              :rules="[val => !!val || 'Title is required']"
            />
            <q-input
              v-model="newTask.description"
              label="Description"
              outlined
              type="textarea"
              rows="3"
              class="q-mb-md"
            />
            <q-select
              v-model="newTask.projectId"
              label="Project"
              :options="projectsList.map(p => ({ label: p.name, value: p.id }))"
              outlined
              emit-value
              map-options
              class="q-mb-md"
            />
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-6">
                <q-input
                  v-model="newTask.deadline"
                  label="Deadline"
                  outlined
                  type="date"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model.number="newTask.expectedEffort"
                  label="Expected Effort (hours)"
                  outlined
                  type="number"
                />
              </div>
            </div>
            <q-select
              v-model="newTask.priority"
              label="Priority"
              :options="['critical', 'high', 'medium', 'low']"
              outlined
              class="q-mb-md"
            />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Create Task" @click="createSelfAssignedTask" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Task Detail Dialog -->
    <q-dialog v-model="showTaskDialog">
      <q-card style="min-width: 600px">
        <q-card-section>
          <div class="text-h6">{{ selectedTask?.title }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div v-if="selectedTask">
            <div class="q-mb-md">
              <strong>Project:</strong> {{ getProjectById(selectedTask.projectId)?.name }}
            </div>
            <div class="q-mb-md">
              <strong>Description:</strong> {{ selectedTask.description }}
            </div>
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-6">
                <strong>Priority:</strong>
                <q-badge :color="getPriorityColor(selectedTask.priority)" class="q-ml-sm text-capitalize">
                  {{ selectedTask.priority }}
                </q-badge>
              </div>
              <div class="col-6">
                <strong>Status:</strong>
                <q-badge :color="getStatusColor(selectedTask.status)" class="q-ml-sm text-capitalize">
                  {{ selectedTask.status.replace('-', ' ') }}
                </q-badge>
              </div>
            </div>
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-6">
                <strong>Deadline:</strong> {{ selectedTask.deadline }}
              </div>
              <div class="col-6">
                <strong>Expected Effort:</strong> {{ selectedTask.expectedEffort }}h
              </div>
            </div>
            <div class="q-mb-md">
              <strong>Progress:</strong>
              <q-linear-progress :value="selectedTask.progress / 100" color="primary" class="q-mt-sm" />
              <div class="text-caption">{{ selectedTask.progress }}%</div>
            </div>
            <q-separator class="q-my-md" />
            <div class="text-h6 q-mb-md">Update Progress</div>
            <q-slider
              v-model="progressUpdate"
              :min="selectedTask.progress"
              :max="100"
              label
              label-always
              color="primary"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
          <q-btn color="primary" label="Update Progress" @click="updateTaskProgress" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import type { Task } from '@/data/mockData'

const taskStore = useTaskStore()

const showCreateTaskDialog = ref(false)
const showTaskDialog = ref(false)
const selectedTask = ref<Task | null>(null)
const progressUpdate = ref(0)

const newTask = ref({
  title: '',
  description: '',
  projectId: '',
  deadline: '',
  expectedEffort: 8,
  priority: 'medium'
})

const currentEmployee = computed(() => taskStore.currentEmployee)
const analytics = computed(() => taskStore.employeeAnalytics)
const projectsList = computed(() => taskStore.projectsList)

const myTasks = computed(() => {
  if (!currentEmployee.value) return []
  return taskStore.getTasksByEmployee(currentEmployee.value.id)
})

const recentWorkLogs = computed(() => {
  if (!currentEmployee.value) return []
  return taskStore
    .getWorkLogsByEmployee(currentEmployee.value.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
})

function getProjectById(id: string) {
  return taskStore.getProjectById(id)
}

function getTaskById(id: string) {
  return taskStore.getTaskById(id)
}

function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    critical: 'red',
    high: 'orange',
    medium: 'blue',
    low: 'green'
  }
  return colors[priority] || 'grey'
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    'not-started': 'grey',
    'in-progress': 'blue',
    completed: 'green',
    blocked: 'red'
  }
  return colors[status] || 'grey'
}

function getProgressColor(progress: number) {
  if (progress >= 75) return 'green'
  if (progress >= 50) return 'blue'
  if (progress >= 25) return 'orange'
  return 'red'
}

function getLogStatusIcon(status: string) {
  const icons: Record<string, string> = {
    completed: 'check_circle',
    'partially-completed': 'remove_circle',
    'in-progress': 'pending'
  }
  return icons[status] || 'circle'
}

function getLogStatusColor(status: string) {
  const colors: Record<string, string> = {
    completed: 'green',
    'partially-completed': 'orange',
    'in-progress': 'blue'
  }
  return colors[status] || 'grey'
}

function showTaskDetail(task: Task) {
  selectedTask.value = task
  progressUpdate.value = task.progress
  showTaskDialog.value = true
}

function createSelfAssignedTask() {
  if (!newTask.value.title || !newTask.value.projectId || !currentEmployee.value) return
  
  taskStore.addTask({
    projectId: newTask.value.projectId,
    title: newTask.value.title,
    description: newTask.value.description,
    status: 'not-started',
    priority: newTask.value.priority as 'critical' | 'high' | 'medium' | 'low',
    deadline: newTask.value.deadline,
    expectedEffort: newTask.value.expectedEffort,
    assignedResources: [currentEmployee.value.id],
    dependencies: [],
    progress: 0
  })
  
  showCreateTaskDialog.value = false
  newTask.value = {
    title: '',
    description: '',
    projectId: '',
    deadline: '',
    expectedEffort: 8,
    priority: 'medium'
  }
}

function updateTaskProgress() {
  if (selectedTask.value && progressUpdate.value > selectedTask.value.progress) {
    taskStore.updateTask(selectedTask.value.id, { progress: progressUpdate.value })
    showTaskDialog.value = false
  }
}
</script>
