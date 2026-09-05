<template>
  <q-page class="q-pa-md text-black" style="background-color: #f8f9fa">
    <!-- Header -->
    <div class="row items-start justify-between q-mb-md">
      <div class="row items-center">
        <q-avatar
          color="indigo-1"
          text-color="indigo"
          icon="bar_chart"
          size="48px"
          class="q-mr-md"
          style="border-radius: 12px"
        />
        <div class="column">
          <div class="text-h5 text-weight-bold">Analytics & Reports</div>
          <div class="text-grey-7 text-caption">
            Track performance, progress and productivity across your workspace
          </div>
        </div>
      </div>
      <div class="column items-end">
        <div class="row items-center q-gutter-md q-mb-md">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            rounded
            bg-color="white"
            placeholder="Search reports..."
            style="width: 320px"
          >
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
          <q-select
            v-model="filterMonth"
            outlined
            dense
            :options="['This Month', 'Last Month', 'This Quarter', 'This Year', 'All Time']"
            style="width: 140px"
            bg-color="white"
            rounded
          >
            <template v-slot:prepend><q-icon name="o_calendar_today" size="18px" /></template>
          </q-select>
          <q-btn
            unelevated
            color="indigo-5"
            icon="o_file_download"
            label="Export Report"
            no-caps
            class="rounded-borders"
            :loading="exporting"
            @click="exportReport"
          />
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col">
        <StatCard
          title="Total Projects"
          :value="(analyticsStore.overview?.totalProjects || 0).toString()"
          color="indigo"
          icon="o_folder"
          caption="active"
        />
      </div>
      <div class="col">
        <StatCard
          title="Completion Rate"
          :value="`${analyticsStore.overview?.taskCompletionRate || 0}%`"
          color="green"
          icon="o_verified_user"
          :caption="`${analyticsStore.overview?.completedTasks || 0} tasks completed`"
        >
          <template v-slot:caption>
            <span class="text-green"><q-icon name="arrow_upward" size="10px" /> 8%</span> from last
            month
          </template>
        </StatCard>
      </div>
      <div class="col">
        <StatCard
          title="At Risk Tasks"
          :value="(analyticsStore.overview?.overdueTasks || 0).toString()"
          color="orange"
          icon="o_warning_amber"
          caption="delayed"
        >
          <template v-slot:caption>
            <span class="text-orange"><q-icon name="arrow_downward" size="10px" /> 2%</span> from
            last month
          </template>
        </StatCard>
      </div>
      <div class="col">
        <StatCard
          title="Avg. Progress"
          :value="`${analyticsStore.overview?.avgProjectProgress || 0}%`"
          color="indigo"
          icon="o_pie_chart"
          caption="Across all projects"
        >
          <template v-slot:caption>
            <span class="text-indigo"><q-icon name="arrow_upward" size="10px" /> 5%</span> from last
            month
          </template>
        </StatCard>
      </div>
      <div class="col">
        <StatCard
          title="Team Utilization"
          :value="`${analyticsStore.overview?.avgUtilization || 0}%`"
          color="blue"
          icon="o_groups"
          caption="average capacity"
        >
          <template v-slot:caption>
            <span class="text-blue"><q-icon name="arrow_upward" size="10px" /> 1%</span> from last
            month
          </template>
        </StatCard>
      </div>
    </div>

    <!-- Overall Performance Meter -->
    <div class="bg-white q-pa-md shadow-1 q-mb-lg rounded-borders">
      <div class="text-subtitle1 text-weight-bold q-mb-md">Overall Performance</div>
      <div class="row items-center justify-center">
        <PerformanceMeter
          :value="analyticsStore.overview?.taskCompletionRate || 0"
          label="Task Completion"
          width="250px"
          height="150px"
        />
        <PerformanceMeter
          :value="analyticsStore.overview?.avgProjectProgress || 0"
          label="Project Progress"
          width="250px"
          height="150px"
        />
        <PerformanceMeter
          :value="analyticsStore.overview?.avgUtilization || 0"
          label="Team Utilization"
          width="250px"
          height="150px"
        />
      </div>
    </div>

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
import { ref, onMounted } from 'vue';
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
import PerformanceMeter from '../components/PerformanceMeter.vue';

const router = useRouter();
const authStore = useAuthStore();
const analyticsStore = useAnalyticsStore();
const $q = useQuasar();

const searchQuery = ref('');
const filterMonth = ref('This Month');
const exporting = ref(false);

onMounted(() => {
  analyticsStore.loadAll();
});

const logout = () => {
  authStore.logout();
  router.push('/auth/login');
};

const exportReport = () => {
  exporting.value = true;
  try {
    const generatedAt = new Date().toLocaleString();
    const overview = analyticsStore.overview || {};
    const rows = analyticsStore.projectPerformance.map((project: any) => `<tr><td><strong>${project.name || 'Unnamed project'}</strong></td><td>${project.status || '—'}</td><td>${Math.round(project.progress || 0)}%</td><td>${project.total_tasks || 0}</td><td>${project.completed_tasks || 0}</td><td>${project.overdue_tasks || 0}</td><td>${project.total_hours_logged || 0}h / ${project.total_estimated_hours || 0}h</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>TASKY Analytics Report</title><style>body{font:14px Arial;color:#263238;margin:48px}header{border-bottom:4px solid #3949ab;padding-bottom:18px;margin-bottom:28px}h1{color:#283593;margin:0 0 8px}.meta{color:#607d8b}.metrics{display:flex;gap:12px;margin:22px 0}.metric{border:1px solid #e0e5ef;border-radius:8px;padding:14px;min-width:130px}.metric b{display:block;font-size:22px;color:#3949ab;margin-top:6px}table{width:100%;border-collapse:collapse;margin-top:18px}th{background:#3949ab;color:white;text-align:left}th,td{padding:11px;border:1px solid #e0e5ef}tr:nth-child(even){background:#f6f8fc}footer{margin-top:36px;color:#78909c;font-size:12px}</style></head><body><header><h1>TASKY Analytics Report</h1><div class="meta">Reporting period: ${filterMonth.value} · Generated: ${generatedAt}</div></header><div class="metrics"><div class="metric">Total projects<b>${overview.totalProjects || 0}</b></div><div class="metric">Completion rate<b>${overview.taskCompletionRate || 0}%</b></div><div class="metric">Avg. progress<b>${overview.avgProjectProgress || 0}%</b></div><div class="metric">Team utilization<b>${overview.avgUtilization || 0}%</b></div></div><h2>Project performance</h2><table><thead><tr><th>Project</th><th>Status</th><th>Progress</th><th>Total tasks</th><th>Completed</th><th>Overdue</th><th>Hours logged / estimated</th></tr></thead><tbody>${rows || '<tr><td colspan="7">No project performance data available.</td></tr>'}</tbody></table><footer>Prepared by TASKY · This report is generated from the workspace analytics dashboard.</footer></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasky-analytics-report-${new Date().toISOString().slice(0, 10)}.html`;
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
.col-8::-webkit-scrollbar,
.col-4::-webkit-scrollbar {
  width: 6px;
}
.col-8::-webkit-scrollbar-track,
.col-4::-webkit-scrollbar-track {
  background: transparent;
}
.col-8::-webkit-scrollbar-thumb,
.col-4::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.col-8::-webkit-scrollbar-thumb:hover,
.col-4::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

:deep(.q-field--dense .q-field__bottom) {
  display: none;
}
:deep(.q-field--outlined .q-field__control) {
  padding: 0 12px;
}
</style>
