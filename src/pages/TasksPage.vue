<template>
  <q-page class="q-pa-md text-black" style="height: 100vh; max-height: 100vh; min-height: 0 !important; display: flex; flex-direction: column; background-color: #f8f9fa;">
    
    <!-- Header -->
    <div class="row items-start justify-between q-mb-md" style="flex: 0 0 auto;">
      <div class="row items-center">
        <q-avatar color="indigo-1" text-color="indigo" icon="o_calendar_today" size="48px" class="q-mr-md" style="border-radius: 12px;" />
        <div class="column">
          <div class="text-h5 text-weight-bold">Tasks</div>
          <div class="text-grey-7 text-caption">View and manage all tasks across your projects</div>
        </div>
      </div>
      <div class="column items-end">
        <div class="row items-center q-gutter-md q-mb-md">
          <q-input v-model="filters.search" outlined dense rounded bg-color="white" placeholder="Search tasks, descriptions..." style="width: 320px;" @update:model-value="applyFilters">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-avatar size="36px" class="cursor-pointer">
            <img :src="authStore.currentUser?.avatar || 'https://cdn.quasar.dev/img/avatar.png'" />
            <q-menu anchor="bottom right" self="top right">
              <q-list style="min-width: 150px">
                <q-item clickable v-close-popup to="/dashboard/profile">
                  <q-item-section avatar><q-icon name="person" /></q-item-section>
                  <q-item-section>Profile</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section avatar><q-icon name="logout" color="red" /></q-item-section>
                  <q-item-section class="text-red">Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-avatar>
        </div>
        <q-btn unelevated color="indigo" icon="add" label="New Task" no-caps class="rounded-borders" @click="openCreateDialog" />
      </div>
    </div>
    
    <!-- Summary Stats -->
    <div class="row q-gutter-x-lg q-mb-md" style="flex: 0 0 auto;">
      <div class="row items-center">
        <q-icon name="o_schedule" color="blue-grey" size="20px" class="q-mr-xs" />
        <div class="text-weight-bold q-mr-sm">{{ taskStore.stats.notStarted || 0 }}</div>
        <div class="text-caption text-grey-7">Not Started</div>
      </div>
      <div class="row items-center">
        <q-icon name="o_play_circle_outline" color="blue" size="20px" class="q-mr-xs" />
        <div class="text-weight-bold text-blue q-mr-sm">{{ taskStore.stats.inProgress || 0 }}</div>
        <div class="text-caption text-grey-7">In Progress</div>
      </div>
      <div class="row items-center">
        <q-icon name="o_warning_amber" color="red" size="20px" class="q-mr-xs" />
        <div class="text-weight-bold text-red q-mr-sm">{{ taskStore.stats.overdue || 0 }}</div>
        <div class="text-caption text-grey-7">Overdue</div>
      </div>
      <div class="row items-center">
        <q-icon name="block" color="orange" size="20px" class="q-mr-xs" />
        <div class="text-weight-bold text-orange q-mr-sm">{{ taskStore.stats.blocked || 0 }}</div>
        <div class="text-caption text-grey-7">Blocked</div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="row items-center justify-between q-mb-md" style="flex: 0 0 auto;">
      <div class="row items-center q-gutter-x-sm">
        <q-select v-model="filters.project" outlined dense :options="projectOptions" style="width: 170px;" bg-color="white" rounded emit-value map-options @update:model-value="applyFilters">
          <template v-slot:prepend><q-icon name="o_folder" size="18px" /></template>
        </q-select>
        <q-select v-model="filters.status" outlined dense :options="statusOptions" style="width: 170px;" bg-color="white" rounded emit-value map-options @update:model-value="applyFilters">
          <template v-slot:prepend><q-icon name="o_settings" size="18px" /></template>
        </q-select>
        <q-select v-model="filters.priority" outlined dense :options="priorityOptions" style="width: 170px;" bg-color="white" rounded emit-value map-options @update:model-value="applyFilters">
          <template v-slot:prepend><q-icon name="o_flag" size="18px" /></template>
        </q-select>
      </div>

      <div class="row items-center q-gutter-x-sm">
        <q-btn v-if="hasActiveFilters" flat color="grey-7" icon="o_filter_alt_off" label="Clear Filters" no-caps size="sm" class="bg-white rounded-borders q-px-sm" style="border: 1px solid #e0e0e0;" @click="clearFilters" />
      </div>
    </div>

    <!-- Data Table -->
    <TasksTable 
      @edit="openEditDialog" 
      @delete="confirmDelete" 
      @view="openTaskDetail" 
    />

    <!-- Dialogs -->
    <CreateTaskDialog v-model="showCreateDialog" :task-to-edit="taskToEdit" @saved="onTaskSaved" />
    <TaskDetailDialog v-model="showDetailDialog" :task-id="selectedTaskId" @edit="openEditDialog" />

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { usePmTaskStore } from '../stores/pmTaskStore';
import { useProjectStore } from '../stores/projectStore';
import { useQuasar } from 'quasar';
import TasksTable from '../components/TasksTable.vue';
import CreateTaskDialog from '../components/CreateTaskDialog.vue';
import TaskDetailDialog from '../components/TaskDetailDialog.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const taskStore = usePmTaskStore();
const projectStore = useProjectStore();
const $q = useQuasar();

const filters = ref({
  search: (route.query.search as string) || '',
  project: 'all',
  status: 'all',
  priority: 'all'
});

const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Not Started', value: 'not-started' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Blocked', value: 'blocked' }
];

const priorityOptions = [
  { label: 'All Priorities', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
];

const projectOptions = computed(() => {
  const opts = [{ label: 'All Projects', value: 'all' }];
  projectStore.projects.forEach((p: any) => {
    opts.push({ label: p.name, value: p.id });
  });
  return opts;
});

const hasActiveFilters = computed(() => {
  return filters.value.search !== '' || filters.value.project !== 'all' || filters.value.status !== 'all' || filters.value.priority !== 'all';
});

onMounted(async () => {
  if (projectStore.projects.length === 0) {
    await projectStore.fetchProjects();
  }
  await applyFilters();

  // If instructed to open a specific task by URL
  if (route.query.open) {
    selectedTaskId.value = route.query.open as string;
    showDetailDialog.value = true;
  }
});

const applyFilters = async () => {
  await taskStore.fetchTasks(filters.value);
};

const clearFilters = () => {
  filters.value = { search: '', project: 'all', status: 'all', priority: 'all' };
  applyFilters();
};

const logout = () => {
  authStore.logout();
  router.push('/auth/login');
};

// Dialogs
const showCreateDialog = ref(false);
const showDetailDialog = ref(false);
const taskToEdit = ref(null);
const selectedTaskId = ref('');

const openCreateDialog = () => {
  taskToEdit.value = null;
  showCreateDialog.value = true;
};

const openEditDialog = (task: any) => {
  taskToEdit.value = task;
  showCreateDialog.value = true;
};

const openTaskDetail = (task: any) => {
  selectedTaskId.value = task.id;
  showDetailDialog.value = true;
};

const onTaskSaved = () => {
  applyFilters();
};

const confirmDelete = (task: any) => {
  $q.dialog({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete "${task.title}"?`,
    cancel: true,
    persistent: true,
    color: 'red'
  }).onOk(async () => {
    try {
      await taskStore.deleteTask(task.id);
      $q.notify({ type: 'positive', message: 'Task deleted' });
      applyFilters();
    } catch (err: any) {
      $q.notify({ type: 'negative', message: err.message || 'Error deleting task' });
    }
  });
};
</script>

<style scoped>
:deep(.q-field--dense .q-field__bottom) {
  display: none;
}
:deep(.q-field--outlined .q-field__control) {
  padding: 0 12px;
}
</style>
