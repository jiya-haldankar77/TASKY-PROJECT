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
          <q-input v-model="searchQuery" outlined dense rounded bg-color="white" placeholder="Search projects, tasks, resources..." style="width: 320px;">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-avatar size="36px">
            <img src="https://cdn.quasar.dev/img/avatar.png" />
          </q-avatar>
        </div>
        <div class="row q-gutter-sm">
          <q-select v-model="filterMonth" outlined dense :options="['This Month']" style="width: 140px;" bg-color="white" rounded>
            <template v-slot:prepend><q-icon name="o_calendar_today" size="18px" /></template>
          </q-select>
          <q-btn unelevated color="indigo-5" icon="o_file_download" label="Export Report" no-caps class="rounded-borders" />
        </div>
      </div>
    </div>
    
    <!-- Summary Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col">
        <StatCard title="Total Projects" value="3" color="indigo" icon="o_folder" caption="3 active" />
      </div>
      <div class="col">
        <StatCard title="Completion Rate" value="27%" color="green" icon="o_verified_user" caption="4 / 15 tasks completed">
          <template v-slot:caption>
            <span class="text-green"><q-icon name="arrow_upward" size="10px" /> 8%</span> from last month
          </template>
        </StatCard>
      </div>
      <div class="col">
        <StatCard title="At Risk Tasks" value="22" color="orange" icon="o_warning_amber" caption="11 delayed">
          <template v-slot:caption>
            <span class="text-orange"><q-icon name="arrow_upward" size="10px" /> 5%</span> from last month
          </template>
        </StatCard>
      </div>
      <div class="col">
        <StatCard title="Avg. Progress" value="63%" color="indigo" icon="o_pie_chart" caption="Across all projects">
          <template v-slot:caption>
            <span class="text-indigo"><q-icon name="arrow_upward" size="10px" /> 7%</span> from last month
          </template>
        </StatCard>
      </div>
      <div class="col">
        <StatCard title="Team Utilization" value="87%" color="blue" icon="o_groups" caption="720h / 825h capacity">
          <template v-slot:caption>
            <span class="text-blue"><q-icon name="arrow_upward" size="10px" /> 5%</span> from last month
          </template>
        </StatCard>
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
import { ref } from 'vue';
import StatCard from '../components/StatCard.vue';
import ProjectProgressWidget from '../components/ProjectProgressWidget.vue';
import ResourceWorkloadTable from '../components/ResourceWorkloadTable.vue';
import ProjectPerformanceTable from '../components/ProjectPerformanceTable.vue';
import TaskStatusDistribution from '../components/TaskStatusDistribution.vue';
import TaskPriorityDistribution from '../components/TaskPriorityDistribution.vue';
import UpcomingDeadlineRisks from '../components/UpcomingDeadlineRisks.vue';

const searchQuery = ref('');
const filterMonth = ref('This Month');
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
