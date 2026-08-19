<template>
  <q-page class="q-pa-sm text-black" style="height: 100vh; max-height: 100vh; min-height: 0 !important; overflow: hidden; display: flex; flex-direction: column;">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-sm" style="flex: 0 0 auto;">
      <div class="text-h6 text-weight-bold">Welcome back, Project Manager 👋</div>
      <div class="row items-center q-gutter-sm">
        <q-input v-model="searchQuery" outlined dense rounded bg-color="white" placeholder="Search..." style="width: 250px;" class="shadow-1">
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
        <q-card flat class="rounded-borders q-pa-sm shadow-1" style="border-radius: 8px;">
           <div class="row justify-between items-center q-mb-xs">
             <div class="text-grey-7 text-caption text-weight-medium" style="font-size: 10px;">Total Projects</div>
             <q-avatar size="24px" color="indigo-1" text-color="indigo" icon="o_folder" />
           </div>
           <div class="text-h6 text-weight-bold text-indigo" style="line-height: 1;">3</div>
           <div class="text-caption text-grey-6" style="font-size: 9px; line-height: 1; margin-top: 2px;">3 active</div>
        </q-card>
      </div>
      <!-- Overall Progress -->
      <div class="col-3">
        <q-card flat class="rounded-borders q-pa-sm shadow-1" style="border-radius: 8px;">
           <div class="row justify-between items-center q-mb-xs">
             <div class="text-grey-7 text-caption text-weight-medium" style="font-size: 10px;">Overall Progress</div>
             <q-avatar size="24px" color="green-1" text-color="green" icon="o_stars" />
           </div>
           <div class="text-h6 text-weight-bold text-green" style="line-height: 1;">63%</div>
           <div class="row items-center text-grey-6" style="font-size: 9px; line-height: 1; margin-top: 2px;">
              <q-icon name="arrow_upward" color="green" size="10px" /> <span class="text-green q-mr-xs">12%</span> from last month
           </div>
           <q-linear-progress :value="0.63" color="green" size="3px" class="q-mt-xs rounded-borders" />
        </q-card>
      </div>
      <!-- Tasks in Progress -->
      <div class="col-3">
        <q-card flat class="rounded-borders q-pa-sm shadow-1" style="border-radius: 8px;">
           <div class="row justify-between items-center q-mb-xs">
             <div class="text-grey-7 text-caption text-weight-medium" style="font-size: 10px;">Tasks in Progress</div>
             <q-avatar size="24px" color="orange-1" text-color="orange" icon="o_settings" />
           </div>
           <div class="text-h6 text-weight-bold text-orange" style="line-height: 1;">6</div>
           <div class="text-caption text-grey-6" style="font-size: 9px; line-height: 1; margin-top: 2px;">4 completed</div>
        </q-card>
      </div>
      <!-- At Risk -->
      <div class="col-3">
        <q-card flat class="rounded-borders q-pa-sm shadow-1" style="border-radius: 8px;">
           <div class="row justify-between items-center q-mb-xs">
             <div class="text-grey-7 text-caption text-weight-medium" style="font-size: 10px;">At Risk</div>
             <q-avatar size="24px" color="red-1" text-color="red" icon="o_warning" />
           </div>
           <div class="text-h6 text-weight-bold text-red" style="line-height: 1;">22</div>
           <div class="text-caption text-grey-6" style="font-size: 9px; line-height: 1; margin-top: 2px;">11 critical</div>
        </q-card>
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
