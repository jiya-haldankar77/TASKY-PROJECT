<template>
  <div class="bg-white q-pa-md shadow-1 q-mb-md" style="border-radius: 12px;">
    <div class="row items-center justify-between q-mb-lg">
      <div class="text-subtitle1 text-weight-bold">Project Progress</div>
      <q-btn flat dense no-caps color="grey-8" label="View All" size="12px" class="bg-grey-2 q-px-sm rounded-borders" style="font-weight: 500;" />
    </div>
    
    <div class="column q-gutter-y-lg">
      <div v-for="(project, index) in projects" :key="index" class="row items-center no-wrap justify-between">
        <div class="row items-center no-wrap" style="width: 250px;">
          <q-avatar :color="project.color" text-color="white" size="24px" class="q-mr-md" style="font-weight: bold; font-size: 11px;">
            {{ project.letter }}
          </q-avatar>
          <div class="text-weight-bold text-grey-9 text-truncate" style="font-size: 13px;">{{ project.name }}</div>
        </div>
        
        <div class="flex-1 q-px-md">
          <q-linear-progress :value="project.progress / 100" :color="project.barColor" size="4px" class="rounded-borders" />
        </div>
        
        <div class="row items-center no-wrap justify-end" style="width: 120px;">
          <div class="text-weight-bold q-mr-md" style="font-size: 14px;">{{ project.progress }}%</div>
          <div class="text-caption text-grey-6" style="font-size: 11px;">{{ project.completedTasks }} / {{ project.totalTasks }} tasks</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const projects = [
  { name: 'E-Commerce Platform Redesign', letter: 'E', color: 'blue', barColor: 'blue', progress: 65, completedTasks: 5, totalTasks: 8 },
  { name: 'Mobile Banking App', letter: 'M', color: 'red', barColor: 'orange', progress: 40, completedTasks: 2, totalTasks: 5 },
  { name: 'Internal Analytics Dashboard', letter: 'I', color: 'green', barColor: 'green', progress: 85, completedTasks: 4, totalTasks: 5 }
];
</script>

<style scoped>
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.flex-1 {
  flex: 1 1 0;
}
</style>
