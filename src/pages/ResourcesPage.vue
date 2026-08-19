<template>
  <q-page class="q-pa-md text-black" style="height: 100vh; max-height: 100vh; min-height: 0 !important; display: flex; flex-direction: column; background-color: #f8f9fa;">
    
    <!-- Header -->
    <div class="row items-start justify-between q-mb-md" style="flex: 0 0 auto;">
      <div class="row items-center">
        <q-avatar color="indigo-1" text-color="indigo" icon="o_groups" size="48px" class="q-mr-md" style="border-radius: 12px;" />
        <div class="column">
          <div class="text-h5 text-weight-bold">Resources & Workload</div>
          <div class="text-grey-7 text-caption">Monitor team capacity, workload, and resource availability</div>
        </div>
      </div>
      <div class="column items-end">
        <div class="row items-center q-gutter-md q-mb-md">
          <q-input v-model="searchQuery" outlined dense rounded bg-color="white" placeholder="Search resources, skills, projects..." style="width: 320px;">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-avatar size="36px">
            <img src="https://cdn.quasar.dev/img/avatar.png" />
          </q-avatar>
        </div>
        <q-btn unelevated color="indigo-5" icon="o_file_download" label="Export Report" no-caps class="rounded-borders" />
      </div>
    </div>
    
    <!-- Summary Cards -->
    <div class="row q-col-gutter-md q-mb-lg" style="flex: 0 0 auto;">
      <div class="col">
        <StatCard title="Total Resources" value="6" color="indigo" icon="o_groups" caption="Team members" />
      </div>
      <div class="col">
        <StatCard title="Available Now" value="2" color="green" icon="o_verified_user" caption="33% of team" />
      </div>
      <div class="col">
        <StatCard title="Overloaded" value="4" color="red" icon="o_warning_amber" caption="67% of team" />
      </div>
      <div class="col">
        <StatCard title="Avg Utilization" value="87%" color="orange" icon="o_schedule">
          <template v-slot:caption>
            <q-icon name="arrow_upward" size="10px" /> 5% from last month
          </template>
        </StatCard>
      </div>
      <div class="col">
        <StatCard title="Total Capacity" value="720h" color="blue" icon="o_timer" caption="This month" />
      </div>
    </div>

    <!-- Main Content Split -->
    <div class="row q-col-gutter-md" style="flex: 1 1 0; min-height: 0;">
      <!-- Left Column: Data Table -->
      <div class="col-8" style="height: 100%; display: flex; flex-direction: column;">
        <ResourceWorkloadTable />
      </div>
      
      <!-- Right Column: Sidebar Widgets -->
      <div class="col-4" style="height: 100%; overflow-y: auto; padding-right: 8px;">
        <ResourceConflicts />
        <WorkloadDistribution />
        <TeamAvailability />
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import StatCard from '../components/StatCard.vue';
import ResourceWorkloadTable from '../components/ResourceWorkloadTable.vue';
import ResourceConflicts from '../components/ResourceConflicts.vue';
import WorkloadDistribution from '../components/WorkloadDistribution.vue';
import TeamAvailability from '../components/TeamAvailability.vue';

const searchQuery = ref('');
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
