<template>
  <q-page class="q-pa-md text-black" style="background-color: #f8f9fa;">
    
    <!-- Header -->
    <div class="row items-start justify-between q-mb-md">
      <div class="row items-center">
        <q-avatar color="indigo-1" text-color="indigo" icon="bar_chart" size="48px" class="q-mr-md" style="border-radius: 12px;" />
        <div class="column">
          <div class="text-h5 text-weight-bold">Analytics & Reports</div>
          <div class="text-grey-7 text-caption">Track performance, progress and productivity across your workspace</div>
        </div>
      </div>
      <div class="column items-end">
        <div class="row items-center q-gutter-md q-mb-md">
          <q-input v-model="searchQuery" outlined dense rounded bg-color="white" placeholder="Search reports..." style="width: 320px;">
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
        <div class="row q-gutter-sm">
          <q-select v-model="filterMonth" outlined dense :options="monthOptions" style="width: 140px;" bg-color="white" rounded @update:model-value="loadAnalytics">
            <template v-slot:prepend><q-icon name="o_calendar_today" size="18px" /></template>
          </q-select>
          <q-btn unelevated color="indigo-5" icon="o_file_download" label="Export Report" no-caps class="rounded-borders" :loading="exporting" @click="exportReport" />
        </div>
      </div>
    </div>
    
    <!-- Summary Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col">
        <StatCard title="Total Projects" :value="(analyticsStore.overview?.total_projects || 0).toString()" color="indigo" icon="o_folder" caption="active" />
      </div>
      <div class="col">
        <StatCard title="Completion Rate" :value="`${analyticsStore.overview?.completion_rate || 0}%`" color="green" icon="o_verified_user" :caption="`${analyticsStore.overview?.completed_tasks || 0} tasks completed`" />
      </div>
      <div class="col">
        <StatCard title="At Risk Tasks" :value="(analyticsStore.overview?.overdue_tasks || 0).toString()" color="orange" icon="o_warning_amber" caption="delayed" />
      </div>
      <div class="col">
        <StatCard title="Active Team" :value="(analyticsStore.overview?.total_members || 0).toString()" color="teal" icon="o_groups" caption="Currently assigned" />
      </div>
    </div>
    <q-banner v-if="analyticsStore.error" dense rounded class="bg-red-1 text-red q-mb-md">{{ analyticsStore.error }}</q-banner>

    <!-- Main Content Split -->
    <div class="row q-col-gutter-lg">
      <!-- Left Column -->
      <div class="col-8 column">
        <ProjectProgressWidget />
        <ResourceWorkloadTable :compact="true" class="q-mb-md" />
        <ProjectPerformanceTable />
      </div>
      
      <!-- Right Column -->
      <div class="col-4 column">
        <TaskStatusDistribution />
        <TaskPriorityDistribution />
        <UpcomingDeadlineRisks />
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../stores/authStore';
import { useAnalyticsStore } from '../stores/analyticsStore';
import StatCard from '../components/StatCard.vue';
import ProjectProgressWidget from '../components/ProjectProgressWidget.vue';
import ResourceWorkloadTable from '../components/ResourceWorkloadTable.vue';
import ProjectPerformanceTable from '../components/ProjectPerformanceTable.vue';
import TaskStatusDistribution from '../components/TaskStatusDistribution.vue';
import TaskPriorityDistribution from '../components/TaskPriorityDistribution.vue';
import UpcomingDeadlineRisks from '../components/UpcomingDeadlineRisks.vue';

const router = useRouter();
const authStore = useAuthStore();
const analyticsStore = useAnalyticsStore();
const $q = useQuasar();

const searchQuery = ref('');
const currentMonth = new Date();
const monthOptions = Array.from({ length: 12 }, (_, offset) => {
  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - offset, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
});
const filterMonth = ref(monthOptions[0] ?? '');
const exporting = ref(false);

const selectedRange = computed(() => {
  const index = Math.max(0, monthOptions.indexOf(filterMonth.value));
  const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - index, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  const toDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { start: toDate(start), end: toDate(end) };
});

const loadAnalytics = () => analyticsStore.loadAll(selectedRange.value);

onMounted(() => {
  loadAnalytics();
});

const logout = () => {
  authStore.logout();
  router.push('/auth/login');
};

const csvCell = (value: unknown) => {
  const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value as string | number | boolean);
  return `"${text.replace(/"/g, '""')}"`;
};
const exportReport = () => {
  exporting.value = true;
  try {
    const rows = analyticsStore.projectPerformance.map((project: any) => [
      project.name,
      project.status,
      project.progress,
      project.total_tasks,
      project.completed_tasks,
      project.overdue_tasks,
      project.total_hours_logged,
      project.total_estimated_hours
    ]);
    const csv = [
      ['Project', 'Status', 'Progress (%)', 'Total Tasks', 'Completed Tasks', 'Overdue Tasks', 'Hours Logged', 'Estimated Hours'],
      ...rows
    ].map(row => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasky-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    $q.notify({ type: 'positive', message: 'Analytics report exported' });
  } finally {
    exporting.value = false;
  }
};
</script>

<style scoped>
/* Scrollbar styling */
.col-8::-webkit-scrollbar, .col-4::-webkit-scrollbar {
  width: 6px;
}
.col-8::-webkit-scrollbar-track, .col-4::-webkit-scrollbar-track {
  background: transparent; 
}
.col-8::-webkit-scrollbar-thumb, .col-4::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 4px;
}
.col-8::-webkit-scrollbar-thumb:hover, .col-4::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; 
}

:deep(.q-field--dense .q-field__bottom) {
  display: none;
}
:deep(.q-field--outlined .q-field__control) {
  padding: 0 12px;
}
</style>
