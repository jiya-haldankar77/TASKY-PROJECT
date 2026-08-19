<template>
  <div class="table-container" style="height: 100%; min-height: 0; overflow: hidden; display: flex; flex-direction: column;">
    <q-table
      :rows="tasks"
      :columns="columns"
      row-key="id"
      flat
      bordered
      v-model:pagination="pagination"
      selection="multiple"
      v-model:selected="selected"
      class="full-height-table"
      style="border-radius: 8px; flex: 1 1 0;"
    >
      <!-- Task Column -->
      <template v-slot:body-cell-task="props">
        <q-td :props="props">
          <div class="column">
            <div class="text-weight-bold text-subtitle2" style="font-size: 13px; line-height: 1.2;">{{ props.row.title }}</div>
            <div class="text-caption text-grey-6" style="font-size: 11px; max-width: 200px; white-space: normal; line-height: 1.2; margin-top: 2px;">{{ props.row.subtitle }}</div>
          </div>
        </q-td>
      </template>

      <!-- Project Column -->
      <template v-slot:body-cell-project="props">
        <q-td :props="props" style="width: 180px;">
          <div class="row items-center no-wrap">
            <q-avatar :color="props.row.projectColor" text-color="white" size="24px" class="q-mr-sm" style="font-weight: bold; font-size: 11px;">
              {{ props.row.projectLetter }}
            </q-avatar>
            <div class="text-grey-8" style="font-size: 12px; white-space: normal; line-height: 1.2;">
              {{ props.row.projectName }}
            </div>
          </div>
        </q-td>
      </template>

      <!-- Priority Column -->
      <template v-slot:body-cell-priority="props">
        <q-td :props="props">
          <q-badge :color="`${getPriorityColor(props.row.priority)}-1`" :text-color="getPriorityColor(props.row.priority)" :label="props.row.priority" class="q-px-sm q-py-xs text-weight-bold rounded-borders" style="font-size: 10px;" />
        </q-td>
      </template>

      <!-- Status Column -->
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="`${getStatusColor(props.row.status)}-1`" :text-color="getStatusColor(props.row.status)" :label="props.row.status" class="q-px-sm q-py-xs text-weight-bold rounded-borders" style="font-size: 10px;" />
        </q-td>
      </template>

      <!-- Progress Column -->
      <template v-slot:body-cell-progress="props">
        <q-td :props="props">
          <div class="column" style="width: 80px;">
            <div class="text-weight-bold text-grey-8 q-mb-xs" style="font-size: 11px;">{{ props.row.progress }}%</div>
            <q-linear-progress :value="props.row.progress / 100" :color="getProgressColor(props.row.progress)" size="3px" class="rounded-borders" />
          </div>
        </q-td>
      </template>

      <!-- Assignee Column -->
      <template v-slot:body-cell-assignee="props">
        <q-td :props="props">
          <div class="row items-center justify-center">
             <q-avatar v-for="(member, i) in props.row.assignees.slice(0, 2)" :key="i" size="24px" class="overlapping-avatar" :style="`margin-left: ${i === 0 ? 0 : '-8px'}; border: 2px solid white;`">
                <img :src="member" />
             </q-avatar>
             <q-avatar v-if="props.row.assignees.length > 2" size="24px" color="indigo-1" text-color="indigo" class="overlapping-avatar" style="margin-left: -8px; border: 2px solid white; font-size: 10px; font-weight: bold;">
                +{{ props.row.assignees.length - 2 }}
             </q-avatar>
          </div>
        </q-td>
      </template>

      <!-- Deadline Column -->
      <template v-slot:body-cell-deadline="props">
        <q-td :props="props">
          <div class="column">
            <div :class="['text-weight-bold', props.row.isOverdue ? 'text-red' : 'text-grey-8']" style="font-size: 12px;">{{ props.row.deadlineDate }}</div>
            <div :class="['text-caption', props.row.isOverdue || props.row.isToday ? 'text-orange' : 'text-grey-6']" style="font-size: 10px;" :style="props.row.isOverdue ? 'color: #f44336 !important;' : ''">
              {{ props.row.deadlineText }}
            </div>
          </div>
        </q-td>
      </template>

      <!-- Actions Column -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <div class="row items-center justify-center q-gutter-x-xs no-wrap">
            <q-btn flat round dense icon="visibility" color="indigo" size="10px" class="bg-indigo-1" />
            <q-btn flat round dense icon="more_vert" color="grey-7" size="10px" class="bg-grey-2" />
          </div>
        </q-td>
      </template>

      <!-- Custom Bottom / Pagination -->
      <template v-slot:bottom>
        <div class="row items-center justify-between text-grey-7 full-width q-py-xs" style="font-size: 13px;">
          <div>Showing {{ showingStart }} to {{ showingEnd }} of {{ tasks.length }} tasks</div>
          <div class="row items-center q-gutter-x-sm">
            <span>Rows per page:</span>
            <q-select v-model="pagination.rowsPerPage" outlined dense :options="[3, 5, 10]" class="q-mr-md bg-white" style="width: 70px;" rounded @update:model-value="pagination.page = 1" />
            <q-btn flat round dense icon="chevron_left" :disable="pagination.page === 1" @click="pagination.page--" />
            <q-btn v-for="p in totalPages" :key="p" :unelevated="p === pagination.page" :flat="p !== pagination.page" round dense :color="p === pagination.page ? 'indigo-1' : ''" :text-color="p === pagination.page ? 'indigo' : 'grey-7'" :label="p" size="12px" @click="pagination.page = p" />
            <q-btn flat round dense icon="chevron_right" :disable="pagination.page === totalPages" @click="pagination.page++" />
          </div>
        </div>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { QTableProps } from 'quasar';

const selected = ref([]);

const columns: QTableProps['columns'] = [
  { name: 'task', label: 'Task', field: 'title', align: 'left', sortable: true },
  { name: 'project', label: 'Project', field: 'projectName', align: 'left', sortable: true },
  { name: 'priority', label: 'Priority', field: 'priority', align: 'center', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'progress', label: 'Progress', field: 'progress', align: 'left', sortable: true },
  { name: 'assignee', label: 'Assignee', field: 'assignees', align: 'center' },
  { name: 'deadline', label: 'Deadline', field: 'deadlineDate', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
];

const tasks = ref([
  {
    id: 1,
    title: 'Design System Implementation',
    subtitle: 'Implement the design system across all components',
    projectLetter: 'E',
    projectColor: 'blue',
    projectName: 'E-Commerce Platform Redesign',
    priority: 'High',
    status: 'Completed',
    progress: 100,
    assignees: ['https://cdn.quasar.dev/img/avatar2.jpg'],
    deadlineDate: '2024-03-15',
    deadlineText: 'Overdue',
    isOverdue: true,
    isToday: false
  },
  {
    id: 2,
    title: 'Product Catalog API',
    subtitle: 'Build RESTful API for product catalog management',
    projectLetter: 'E',
    projectColor: 'blue',
    projectName: 'E-Commerce Platform Redesign',
    priority: 'High',
    status: 'In Progress',
    progress: 70,
    assignees: ['https://cdn.quasar.dev/img/avatar3.jpg', 'https://cdn.quasar.dev/img/avatar4.jpg', 'extra'],
    deadlineDate: '2024-04-20',
    deadlineText: '5 days left',
    isOverdue: false,
    isToday: false
  },
  {
    id: 3,
    title: 'Shopping Cart Module',
    subtitle: 'Develop shopping cart functionality with persistence',
    projectLetter: 'E',
    projectColor: 'blue',
    projectName: 'E-Commerce Platform Redesign',
    priority: 'High',
    status: 'In Progress',
    progress: 45,
    assignees: ['https://cdn.quasar.dev/img/avatar5.jpg', 'https://cdn.quasar.dev/img/avatar6.jpg'],
    deadlineDate: '2024-04-30',
    deadlineText: '15 days left',
    isOverdue: false,
    isToday: false
  },
  {
    id: 4,
    title: 'Payment Gateway Integration',
    subtitle: 'Integrate multiple payment gateways',
    projectLetter: 'E',
    projectColor: 'blue',
    projectName: 'E-Commerce Platform Redesign',
    priority: 'Critical',
    status: 'Not Started',
    progress: 0,
    assignees: ['https://cdn.quasar.dev/img/avatar1.jpg', 'https://cdn.quasar.dev/img/avatar2.jpg'],
    deadlineDate: '2024-05-15',
    deadlineText: '30 days left',
    isOverdue: false,
    isToday: false
  },
  {
    id: 5,
    title: 'Performance Optimization',
    subtitle: 'Optimize load times and implement caching',
    projectLetter: 'E',
    projectColor: 'blue',
    projectName: 'E-Commerce Platform Redesign',
    priority: 'Medium',
    status: 'Not Started',
    progress: 0,
    assignees: ['https://cdn.quasar.dev/img/avatar4.jpg'],
    deadlineDate: '2024-05-30',
    deadlineText: '45 days left',
    isOverdue: false,
    isToday: false
  },
  {
    id: 6,
    title: 'Security Architecture',
    subtitle: 'Implement security best practices and authentication',
    projectLetter: 'M',
    projectColor: 'red',
    projectName: 'Mobile Banking App',
    priority: 'Critical',
    status: 'Completed',
    progress: 100,
    assignees: ['https://cdn.quasar.dev/img/avatar5.jpg', 'https://cdn.quasar.dev/img/avatar6.jpg'],
    deadlineDate: '2024-03-30',
    deadlineText: 'Completed',
    isOverdue: false,
    isToday: false
  },
  {
    id: 7,
    title: 'User Authentication',
    subtitle: 'Implement secure user authentication and authorization',
    projectLetter: 'M',
    projectColor: 'red',
    projectName: 'Mobile Banking App',
    priority: 'Critical',
    status: 'In Progress',
    progress: 60,
    assignees: ['https://cdn.quasar.dev/img/avatar1.jpg', 'https://cdn.quasar.dev/img/avatar3.jpg', 'extra'],
    deadlineDate: '2024-04-15',
    deadlineText: 'Today',
    isOverdue: false,
    isToday: true
  }
]);

const getPriorityColor = (priority: string) => {
  if (priority === 'Critical') return 'red';
  if (priority === 'High') return 'orange';
  if (priority === 'Medium') return 'blue';
  return 'grey';
};

const getStatusColor = (status: string) => {
  if (status === 'Completed') return 'green';
  if (status === 'In Progress') return 'blue';
  if (status === 'Not Started') return 'grey';
  return 'grey';
};

const getProgressColor = (progress: number) => {
  if (progress === 100) return 'green';
  if (progress >= 50) return 'blue';
  if (progress > 0) return 'orange';
  return 'grey-4';
};

const pagination = ref({
  page: 1,
  rowsPerPage: 10
});

const totalPages = computed(() => Math.ceil(tasks.value.length / pagination.value.rowsPerPage));
const showingStart = computed(() => tasks.value.length === 0 ? 0 : (pagination.value.page - 1) * pagination.value.rowsPerPage + 1);
const showingEnd = computed(() => Math.min(pagination.value.page * pagination.value.rowsPerPage, tasks.value.length));
</script>

<style scoped>
.overlapping-avatar {
  z-index: 1;
}
.overlapping-avatar:hover {
  z-index: 10;
}

/* Sticky Header Table styling */
.full-height-table {
  height: 100%;
}
:deep(.full-height-table .q-table__middle) {
  max-height: 100%;
}
:deep(.full-height-table thead tr th) {
  position: sticky;
  z-index: 1;
  background-color: #fff;
  font-weight: 600;
  color: #757575;
}
:deep(.full-height-table thead tr:first-child th) {
  top: 0;
}
</style>
