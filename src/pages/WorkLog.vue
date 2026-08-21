<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4 text-weight-bold">Daily Work Log</div>
      <q-btn color="primary" icon="add" label="New Entry" @click="showCreateLogDialog = true" />
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
        <q-btn color="orange" label="Submit Now" @click="showCreateLogDialog = true" />
      </q-card-section>
    </q-card>

    <!-- Work Log Entries -->
    <q-card>
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="text-h6 text-weight-bold">My Work Log History</div>
          <q-select
            v-model="selectedTaskFilter"
            label="Filter by Task"
            :options="taskOptions"
            outlined
            dense
            clearable
            emit-value
            map-options
            style="min-width: 200px"
          />
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-list separator>
          <q-item v-for="log in filteredWorkLogs" :key="log.id">
            <q-item-section avatar>
              <q-icon :name="getLogStatusIcon(log.status)" :color="getLogStatusColor(log.status)" size="32px" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ getTaskById(log.taskId)?.title }}</q-item-label>
              <q-item-label caption>
                {{ getProjectById(getTaskById(log.taskId)?.projectId || '')?.name }} • {{ log.date }}
              </q-item-label>
              <div class="text-caption q-mt-xs">
                <strong>Work Completed:</strong> {{ log.workCompleted }}
              </div>
              <div v-if="log.remainingWork" class="text-caption">
                <strong>Remaining:</strong> {{ log.remainingWork }}
              </div>
              <div v-if="log.comments" class="text-caption text-grey-6 q-mt-xs">
                {{ log.comments }}
              </div>
            </q-item-section>
            <q-item-section side>
              <div class="column items-end">
                <q-badge :color="getLogStatusColor(log.status)" class="text-capitalize q-mb-xs">
                  {{ log.status.replace('-', ' ') }}
                </q-badge>
                <div class="text-caption">{{ log.hoursSpent }}h</div>
              </div>
            </q-item-section>
          </q-item>
          <q-item v-if="filteredWorkLogs.length === 0">
            <q-item-section class="text-center text-grey-6">
              <q-icon name="edit_note" size="48px" color="grey-4" />
              <div class="text-h6 q-mt-md">No work log entries</div>
              <div class="text-caption">Start by adding your first daily update</div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Create Work Log Dialog -->
    <q-dialog v-model="showCreateLogDialog">
      <q-card style="min-width: 500px; max-width: 700px">
        <q-card-section>
          <div class="text-h6">Submit Daily Work Log</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-form @submit="submitWorkLog">
            <q-input
              v-model="newLog.date"
              label="Date"
              outlined
              type="date"
              class="q-mb-md"
              :rules="[val => !!val || 'Date is required']"
            />
            <q-select
              v-model="newLog.taskId"
              label="Task"
              :options="taskOptions"
              outlined
              emit-value
              map-options
              class="q-mb-md"
              :rules="[val => !!val || 'Task is required']"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-avatar :style="{ backgroundColor: getProjectById(getTaskById(scope.opt.value)?.projectId || '')?.color }" size="24px" text-color="white">
                      {{ getProjectById(getTaskById(scope.opt.value)?.projectId || '')?.name.charAt(0) }}
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>{{ getProjectById(getTaskById(scope.opt.value)?.projectId || '')?.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-select
              v-model="newLog.status"
              label="Status"
              :options="statusOptions"
              outlined
              class="q-mb-md"
              :rules="[val => !!val || 'Status is required']"
            />
            <q-input
              v-model.number="newLog.hoursSpent"
              label="Hours Spent"
              outlined
              type="number"
              class="q-mb-md"
              :rules="[val => !!val && val > 0 || 'Hours must be greater than 0']"
            />
            <q-input
              v-model="newLog.workCompleted"
              label="Work Completed"
              outlined
              type="textarea"
              rows="2"
              class="q-mb-md"
              :rules="[val => !!val || 'Please describe completed work']"
            />
            <q-input
              v-model="newLog.remainingWork"
              label="Remaining Work (optional)"
              outlined
              type="textarea"
              rows="2"
              class="q-mb-md"
            />
            <q-input
              v-model="newLog.comments"
              label="Comments/Notes (optional)"
              outlined
              type="textarea"
              rows="2"
            />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Submit" @click="submitWorkLog" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTaskStore } from '@/stores/taskStore'

const taskStore = useTaskStore()

const showCreateLogDialog = ref(false)
const selectedTaskFilter = ref<string | null>(null)

const newLog = ref({
  date: new Date().toISOString().split('T')[0],
  taskId: '',
  status: 'in-progress',
  hoursSpent: 4,
  workCompleted: '',
  remainingWork: '',
  comments: ''
})

const statusOptions = ['completed', 'partially-completed', 'in-progress']

const currentEmployee = computed(() => taskStore.currentEmployee)
const analytics = computed(() => taskStore.employeeAnalytics)

const myTasks = computed(() => {
  if (!currentEmployee.value) return []
  return taskStore.getTasksByEmployee(currentEmployee.value.id)
})

const taskOptions = computed(() =>
  myTasks.value.map(t => ({ label: t.title, value: t.id }))
)

const myWorkLogs = computed(() => {
  if (!currentEmployee.value) return []
  return taskStore.getWorkLogsByEmployee(currentEmployee.value.id)
})

const filteredWorkLogs = computed(() => {
  let logs = myWorkLogs.value
  if (selectedTaskFilter.value) {
    logs = logs.filter(log => log.taskId === selectedTaskFilter.value)
  }
  return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

function getTaskById(id: string) {
  return taskStore.getTaskById(id)
}

function getProjectById(id: string) {
  return taskStore.getProjectById(id)
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

function submitWorkLog() {
  if (!newLog.value.taskId || !newLog.value.date || !currentEmployee.value) return

  taskStore.addWorkLog({
    taskId: newLog.value.taskId,
    employeeId: currentEmployee.value.id,
    date: newLog.value.date,
    status: newLog.value.status as 'completed' | 'partially-completed' | 'in-progress',
    workCompleted: newLog.value.workCompleted,
    remainingWork: newLog.value.remainingWork,
    comments: newLog.value.comments,
    hoursSpent: newLog.value.hoursSpent
  })

  // Update task progress based on work log status
  const task = getTaskById(newLog.value.taskId)
  if (task) {
    const progressIncrement = 
      newLog.value.status === 'completed' ? 25 :
      newLog.value.status === 'partially-completed' ? 10 : 5

    const newProgress = Math.min(task.progress + progressIncrement, 100)
    taskStore.updateTask(task.id, { progress: newProgress })
  }

  showCreateLogDialog.value = false
  newLog.value = {
    date: new Date().toISOString().split('T')[0],
    taskId: '',
    status: 'in-progress',
    hoursSpent: 4,
    workCompleted: '',
    remainingWork: '',
    comments: ''
  }
}
</script>
