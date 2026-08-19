<template>
  <div class="table-container bg-white q-pa-md shadow-1" :style="compact ? 'border-radius: 12px;' : 'height: 100%; min-height: 0; overflow: hidden; display: flex; flex-direction: column; border-radius: 12px;'">
    
    <div class="row items-center justify-between q-mb-md" style="flex: 0 0 auto;">
      <div class="text-subtitle1 text-weight-bold">Resource Workload{{ compact ? '' : ' Overview' }}</div>
      <div class="row q-gutter-sm" v-if="!compact">
        <q-select v-model="filterMonth" outlined dense :options="['This Month']" style="width: 140px;" bg-color="white" rounded>
          <template v-slot:prepend><q-icon name="o_calendar_today" size="18px" /></template>
        </q-select>
        <q-select v-model="filterView" outlined dense :options="['View by: List']" style="width: 150px;" bg-color="white" rounded>
          <template v-slot:prepend><q-icon name="o_format_list_bulleted" size="18px" /></template>
        </q-select>
      </div>
      <q-btn v-else flat dense no-caps color="grey-8" label="View All" size="12px" class="bg-grey-2 q-px-sm rounded-borders" style="font-weight: 500;" />
    </div>

    <q-table
      :rows="resources"
      :columns="columns"
      row-key="id"
      flat
      hide-bottom
      v-model:pagination="pagination"
      :class="compact ? '' : 'full-height-table'"
      :style="compact ? '' : 'flex: 1 1 0;'"
    >
      <!-- Resource Column -->
      <template v-slot:body-cell-resource="props">
        <q-td :props="props" style="width: 200px;">
          <div class="row items-center no-wrap">
            <q-avatar size="32px" class="q-mr-sm">
              <img :src="props.row.avatar" />
            </q-avatar>
            <div class="column">
              <div class="text-weight-bold" style="font-size: 13px; color: #333;">{{ props.row.name }}</div>
              <div class="text-caption text-grey-7" style="font-size: 11px;">{{ props.row.title }}</div>
            </div>
          </div>
        </q-td>
      </template>

      <!-- Role Column -->
      <template v-slot:body-cell-role="props">
        <q-td :props="props">
          <div class="text-grey-8" style="font-size: 13px;">{{ props.row.role }}</div>
        </q-td>
      </template>

      <!-- Workload Column -->
      <template v-slot:body-cell-workload="props">
        <q-td :props="props" style="width: 120px;">
          <div class="column">
            <div class="text-weight-bold text-grey-8 q-mb-xs" style="font-size: 12px;">{{ props.row.workloadValue }}h / 130h</div>
            <q-linear-progress :value="props.row.workloadValue / 130" :color="getUtilizationColor(props.row.utilization)" size="3px" class="rounded-borders" />
          </div>
        </q-td>
      </template>

      <!-- Utilization Column -->
      <template v-slot:body-cell-utilization="props">
        <q-td :props="props">
          <div class="text-weight-bold" :class="`text-${getUtilizationColor(props.row.utilization)}`" style="font-size: 13px;">
            {{ props.row.utilization }}%
          </div>
        </q-td>
      </template>

      <!-- Status Column -->
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge :color="`${getStatusColor(props.row.status)}-1`" :text-color="getStatusColor(props.row.status)" :label="props.row.status" class="q-px-sm q-py-xs text-weight-bold rounded-borders" style="font-size: 10px;" />
        </q-td>
      </template>

      <!-- Tasks Column -->
      <template v-slot:body-cell-tasks="props">
        <q-td :props="props">
          <div class="column items-center">
            <div class="text-weight-bold text-grey-8" style="font-size: 13px;">{{ props.row.tasks }}</div>
            <div class="text-caption text-grey-6" style="font-size: 10px;">active</div>
          </div>
        </q-td>
      </template>

      <!-- Projects Column -->
      <template v-slot:body-cell-projects="props">
        <q-td :props="props">
          <div class="row items-center justify-center q-gutter-x-xs">
            <q-avatar v-for="(p, i) in props.row.projects" :key="i" :color="p.color" text-color="white" size="20px" style="font-size: 10px; font-weight: bold;">
              {{ p.letter }}
            </q-avatar>
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
      <template v-slot:bottom v-if="!compact">
        <div class="row items-center justify-between text-grey-7 full-width q-py-sm" style="font-size: 13px; border-top: 1px solid #f0f0f0;">
          <div>Showing {{ showingStart }} to {{ showingEnd }} of {{ resources.length }} resources</div>
          <div class="row items-center q-gutter-x-sm">
            <span>Rows per page:</span>
            <q-select v-model="pagination.rowsPerPage" outlined dense :options="[6, 10, 20]" class="q-mr-md bg-white" style="width: 70px;" rounded @update:model-value="pagination.page = 1" />
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

const props = defineProps({
  compact: {
    type: Boolean,
    default: false
  }
});

const filterMonth = ref('This Month');
const filterView = ref('View by: List');

const baseColumns: QTableProps['columns'] = [
  { name: 'resource', label: 'Resource', field: 'name', align: 'left', sortable: true },
  { name: 'role', label: 'Role', field: 'role', align: 'left', sortable: true },
  { name: 'workload', label: 'Workload', field: 'workloadValue', align: 'left', sortable: true },
  { name: 'utilization', label: 'Utilization', field: 'utilization', align: 'center', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'center', sortable: true },
  { name: 'tasks', label: 'Tasks', field: 'tasks', align: 'center', sortable: true },
  { name: 'projects', label: 'Projects', field: 'projects', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'id', align: 'center' }
];

const columns = computed(() => {
  if (props.compact) {
    return baseColumns.filter(c => ['resource', 'workload', 'utilization', 'status'].includes(c.name));
  }
  return baseColumns;
});

const resources = ref([
  {
    id: 1,
    avatar: 'https://cdn.quasar.dev/img/avatar2.jpg',
    name: 'Sarah Johnson',
    title: 'Senior Developer',
    role: 'Frontend Developer',
    workloadValue: 124.5,
    utilization: 96,
    status: 'Overloaded',
    tasks: 5,
    projects: [{letter: 'E', color: 'blue'}, {letter: 'M', color: 'red'}, {letter: 'I', color: 'green'}]
  },
  {
    id: 2,
    avatar: 'https://cdn.quasar.dev/img/avatar3.jpg',
    name: 'Michael Chen',
    title: 'Full Stack Developer',
    role: 'Full Stack Developer',
    workloadValue: 120.5,
    utilization: 93,
    status: 'Overloaded',
    tasks: 5,
    projects: [{letter: 'E', color: 'blue'}, {letter: 'M', color: 'red'}, {letter: 'I', color: 'green'}]
  },
  {
    id: 3,
    avatar: 'https://cdn.quasar.dev/img/avatar4.jpg',
    name: 'Emily Davis',
    title: 'UI/UX Designer',
    role: 'Designer',
    workloadValue: 90,
    utilization: 69,
    status: 'Available',
    tasks: 3,
    projects: [{letter: 'E', color: 'blue'}, {letter: 'I', color: 'green'}]
  },
  {
    id: 4,
    avatar: 'https://cdn.quasar.dev/img/avatar5.jpg',
    name: 'James Wilson',
    title: 'Backend Developer',
    role: 'Backend Developer',
    workloadValue: 135,
    utilization: 104,
    status: 'Overloaded',
    tasks: 6,
    projects: [{letter: 'E', color: 'blue'}, {letter: 'M', color: 'red'}, {letter: 'I', color: 'green'}]
  },
  {
    id: 5,
    avatar: 'https://cdn.quasar.dev/img/avatar6.jpg',
    name: 'Lisa Anderson',
    title: 'DevOps Engineer',
    role: 'DevOps Engineer',
    workloadValue: 115,
    utilization: 88,
    status: 'Overloaded',
    tasks: 4,
    projects: [{letter: 'I', color: 'green'}, {letter: 'M', color: 'red'}]
  },
  {
    id: 6,
    avatar: 'https://cdn.quasar.dev/img/avatar1.jpg',
    name: 'David Brown',
    title: 'QA Engineer',
    role: 'QA Engineer',
    workloadValue: 60,
    utilization: 46,
    status: 'Available',
    tasks: 2,
    projects: [{letter: 'M', color: 'red'}]
  }
]);

const getUtilizationColor = (utilization: number) => {
  if (utilization >= 100) return 'red';
  if (utilization >= 85) return 'orange';
  return 'green';
};

const getStatusColor = (status: string) => {
  if (status === 'Overloaded') return 'red';
  if (status === 'Available') return 'green';
  return 'grey';
};

const pagination = ref({
  page: 1,
  rowsPerPage: 10
});

const totalPages = computed(() => Math.max(1, Math.ceil(resources.value.length / pagination.value.rowsPerPage)));
const showingStart = computed(() => resources.value.length === 0 ? 0 : (pagination.value.page - 1) * pagination.value.rowsPerPage + 1);
const showingEnd = computed(() => Math.min(pagination.value.page * pagination.value.rowsPerPage, resources.value.length));
</script>

<style scoped>
:deep(.q-field--dense .q-field__bottom) {
  display: none;
}
:deep(.q-field--outlined .q-field__control) {
  padding: 0 12px;
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
  border-bottom: 1px solid #f0f0f0;
}
:deep(.full-height-table thead tr:first-child th) {
  top: 0;
}
</style>
