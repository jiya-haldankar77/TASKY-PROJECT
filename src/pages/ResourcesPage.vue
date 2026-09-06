<template>
  <q-page class="q-pa-md" style="background-color: #f8f9fa">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
        <q-avatar color="indigo-1" text-color="indigo" icon="o_groups" size="48px" class="q-mr-md" />
        <div>
          <div class="text-h5 text-weight-bold">Resources & Workload</div>
          <div class="text-grey-7 text-caption">Monitor team capacity and workload</div>
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-input
          v-model="searchQuery"
          outlined
          dense
          rounded
          placeholder="Search resources..."
          bg-color="white"
          style="width: 250px"
        >
          <template v-slot:prepend><q-icon name="search" /></template>
        </q-input>
        
      </div>
    </div>

    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
      <q-select
          v-model="roleFilter"
          outlined
          dense
          rounded
          emit-value
          map-options
          :options="roleOptions"
          bg-color="white"
          style="width: 150px"
        >
          <template v-slot:prepend><q-icon name="o_badge" size="18px" /></template>
        </q-select>
        <q-select
          v-model="statusFilter"
          outlined
          dense
          rounded
          emit-value
          map-options
          :options="statusOptions"
          bg-color="white"
          style="width: 150px"
        >
          <template v-slot:prepend><q-icon name="o_filter_alt" size="18px" /></template>
        </q-select>
        <q-btn
          v-if="hasActiveFilters"
          flat
          round
          dense
          icon="clear"
          color="grey-7"
          @click="clearFilters"
        >
          <q-tooltip>Clear filters</q-tooltip>
        </q-btn>
        </div>
        </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-1 q-pa-md rounded-borders q-mb-md">
      <div class="text-red text-weight-bold">Error loading resources</div>
      <div class="text-red-8">{{ error }}</div>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Employee List -->
    <div v-else-if="employees.length > 0">
      <q-table
        :rows="filteredEmployees"
        :columns="columns"
        row-key="user_id"
        flat
        bordered
        class="bg-white"
        @row-click="openResourceDetail"
      >
        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <div class="row items-center">
              <q-avatar size="32px" class="q-mr-sm">
                <img :src="props.row.avatar_url || props.row.avatar || `https://i.pravatar.cc/150?img=${props.row.user_id || props.row.id}`" />
              </q-avatar>
              <div>
                <div class="text-weight-bold">{{ props.row.first_name }} {{ props.row.last_name }}</div>
                <div class="text-caption text-grey-7">{{ props.row.employee_code }}</div>
              </div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-utilization="props">
          <q-td :props="props">
            <div class="text-weight-bold" :class="getUtilizationColor(props.row.utilization)">
              {{ props.row.utilization }}%
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="getStatusColor(props.row.workload_status)">
              {{ formatStatus(props.row.workload_status) }}
            </q-badge>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-center  q-pa-xl text-grey-6">
      <div class="text-center">
        <q-icon name="person_off" size="64px" color="grey-4" class="q-mb-md" />
        <div class="text-h6">No resources found</div>
      </div>
    </div>

    <!-- Resource Detail Dialog -->
    <ResourceDetailDialog
      v-model="showResourceDialog"
      :resource-id="selectedResourceId"
      @reassigned="fetchEmployees"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ResourceDetailDialog from '../components/ResourceDetailDialog.vue';

const employees = ref<any[]>([]);
const searchQuery = ref('');
const roleFilter = ref('all');
const statusFilter = ref('all');
const loading = ref(false);
const error = ref<string | null>(null);
const showResourceDialog = ref(false);
const selectedResourceId = ref<number>(0);

const columns = [
  { name: 'name', label: 'Employee', field: 'first_name', align: 'left' as const, sortable: true },
  { name: 'role', label: 'Role', field: 'role_name', align: 'left' as const, sortable: true },
  { name: 'utilization', label: 'Utilization', field: 'utilization', align: 'center' as const, sortable: true, format: (val: number) => `${Math.round(val)}%` },
  { name: 'tasks', label: 'Active Tasks', field: 'active_task_count', align: 'center' as const, sortable: true },
  { name: 'hours', label: 'Weekly Hours', field: 'weekly_required_hours', align: 'center' as const, sortable: true, format: (val: number) => `${Math.round(val)}h` },
  { name: 'status', label: 'Status', field: 'workload_status', align: 'center' as const, sortable: true },
];

const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Near Capacity', value: 'near-capacity' },
  { label: 'Overloaded', value: 'overloaded' },
];

const roleOptions = computed(() => [
  { label: 'All Roles', value: 'all' },
  ...Array.from(new Set(employees.value.map((employee) => employee.role_name).filter(Boolean))).map(
    (role) => ({ label: role, value: role }),
  ),
]);

const hasActiveFilters = computed(
  () => Boolean(searchQuery.value.trim()) || roleFilter.value !== 'all' || statusFilter.value !== 'all',
);

const filteredEmployees = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();

  return employees.value.filter((employee) => {
    const name = `${employee.first_name} ${employee.last_name}`.toLowerCase();
    const code = (employee.employee_code || '').toLowerCase();
    const role = (employee.role_name || '').toLowerCase();
    const status = (employee.workload_status || '').toLowerCase();

    const matchesSearch = !query || (
      name.includes(query) ||
      code.includes(query) ||
      role.includes(query) ||
      status.includes(query)
    );
    const matchesRole = roleFilter.value === 'all' || employee.role_name === roleFilter.value;
    const matchesStatus = statusFilter.value === 'all' || employee.workload_status === statusFilter.value;

    return matchesSearch && matchesRole && matchesStatus;
  });
});

const clearFilters = () => {
  searchQuery.value = '';
  roleFilter.value = 'all';
  statusFilter.value = 'all';
};

const fetchEmployees = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch('http://localhost:3001/api/pm/resources', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();

    if (data.success) {
      employees.value = data.resources;
    } else {
      error.value = data.error || 'Failed to load resources';
    }
  } catch (err: any) {
    error.value = err.message || 'Network error';
  } finally {
    loading.value = false;
  }
};

const getUtilizationColor = (utilization: number) => {
  if (utilization >= 100) return 'text-red';
  if (utilization >= 85) return 'text-orange';
  if (utilization < 50) return 'text-blue';
  return 'text-green';
};

const getStatusColor = (status: string) => {
  if (status === 'overloaded') return 'red';
  return 'green';
};

const formatStatus = (status: string) => {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Normal';
};

const openResourceDetail = (evt: any, row: any) => {
  selectedResourceId.value = row.user_id;
  showResourceDialog.value = true;
};

onMounted(() => {
  fetchEmployees();
});
</script>

<style scoped>
/* Scrollbar styling for sidebar */
.col-4::-webkit-scrollbar {
  width: 6px;
}
.col-4::-webkit-scrollbar-track {
  background: transparent;
}
.col-4::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.col-4::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
