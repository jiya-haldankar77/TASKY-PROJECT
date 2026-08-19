<template>
  <q-page class="q-pa-sm text-black" style="height: 100vh; max-height: 100vh; min-height: 0 !important; overflow: hidden; display: flex; flex-direction: column;">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-sm" style="flex: 0 0 auto;">
      <div class="text-h6 text-weight-bold">Welcome back, Project Manager 👋</div>
      <div class="row items-center q-gutter-sm">
        <q-input v-model="searchQuery" outlined dense rounded bg-color="white" placeholder="Search..." style="width: 250px;">
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-avatar size="32px">
          <img src="https://cdn.quasar.dev/img/avatar.png" />
        </q-avatar>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row q-col-gutter-sm q-mb-sm" style="flex: 0 0 auto;">
      <!-- Total Projects -->
      <div class="col-3">
        <StatCard title="Total Projects" value="3" color="indigo" icon="o_folder" caption="3 active" />
      </div>
      <!-- Overall Progress -->
      <div class="col-3">
        <StatCard title="Overall Progress" value="63%" color="green" icon="o_stars" :progressValue="0.63">
          <template v-slot:caption>
            <q-icon name="arrow_upward" color="green" size="10px" /> <span class="text-green q-mr-xs">12%</span> from last month
          </template>
        </StatCard>
      </div>
      <!-- Tasks in Progress -->
      <div class="col-3">
        <StatCard title="Tasks in Progress" value="6" color="orange" icon="o_settings" caption="4 completed" />
      </div>
      <!-- At Risk -->
      <div class="col-3">
        <StatCard title="At Risk" value="22" color="red" icon="o_warning" caption="11 critical" />
      </div>
    </div>

    <!-- Main Grid Rows -->
    <div class="flex column" style="flex: 1 1 0; min-height: 0; gap: 8px;">
       
       <!-- Row 1: Projects Overview (Full width) -->
       <div class="row" style="flex: 1.4 1 0; min-height: 0;">
         <div class="col-12" style="height: 100%;">
           <ProjectsOverview />
         </div>
       </div>

       <!-- Row 2: 4 equal cards -->
       <div class="row q-col-gutter-sm" style="flex: 1 1 0; min-height: 0;">
          <!-- Tasks by Priority -->
          <div class="col-3" style="height: 100%;">
            <TasksByPriority />
          </div>

          <!-- Task Status -->
          <div class="col-3" style="height: 100%;">
            <TaskStatus />
          </div>

          <!-- Recent Activity -->
          <div class="col-3" style="height: 100%;">
            <RecentActivity />
          </div>

          <!-- Calendar -->
          <div class="col-3" style="height: 100%;">
            <CalendarWidget />
          </div>
       </div>

       <!-- Row 3: Resource Workload and Upcoming Deadlines -->
       <div class="row q-col-gutter-sm" style="flex: 1.4 1 0; min-height: 0;">
          <!-- Resource Workload (2/3rd) -->
          <div class="col-8" style="height: 100%;">
            <ResourceWorkload />
          </div>

          <!-- Upcoming Deadlines (1/3rd) -->
          <div class="col-4" style="height: 100%;">
            <UpcomingDeadlines />
          </div>
       </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import StatCard from '../components/StatCard.vue';
import ProjectsOverview from '../components/ProjectsOverview.vue';
import TasksByPriority from '../components/TasksByPriority.vue';
import TaskStatus from '../components/TaskStatus.vue';
import RecentActivity from '../components/RecentActivity.vue';
import CalendarWidget from '../components/CalendarWidget.vue';
import ResourceWorkload from '../components/ResourceWorkload.vue';
import UpcomingDeadlines from '../components/UpcomingDeadlines.vue';

const searchQuery = ref('');
</script>

<style scoped>
.z-top {
  z-index: 10;
}
</style>
