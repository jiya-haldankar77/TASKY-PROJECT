<template>
  <q-card flat bordered class="q-pa-md q-mb-md" style="border-radius: 8px; border-color: #f0f0f0;">
    <div class="row items-center">
      <!-- Left Section -->
      <div class="col-5 row no-wrap items-start">
        <q-avatar :color="project.avatarColor" text-color="white" size="48px" class="q-mr-md" style="font-weight: bold;">
          {{ project.avatarLetter }}
        </q-avatar>
        <div class="column">
          <div class="text-subtitle1 text-weight-bold" style="line-height: 1.2;">{{ project.name }}</div>
          <div class="text-caption text-grey-7 q-mb-xs q-mt-xs" style="line-height: 1.3; font-size: 11px; max-width: 90%;">{{ project.description }}</div>
          <div class="row items-center q-gutter-x-sm q-mb-sm q-mt-xs">
             <q-badge color="green-1" text-color="green" label="Active" class="q-px-sm q-py-xs text-weight-bold" style="font-size: 10px;" />
             <q-badge :color="`${priorityColor}-1`" :text-color="priorityColor" :label="project.priority" class="q-px-sm q-py-xs text-weight-bold rounded-borders" style="font-size: 10px;" />
          </div>
          <div class="row items-center text-grey-6" style="font-size: 11px;">
            <q-icon name="o_calendar_today" size="14px" class="q-mr-xs" />
            <span class="q-mr-md">{{ project.startDate }} - {{ project.endDate }}</span>
            <q-icon name="o_assignment" size="14px" class="q-mr-xs" />
            <span>{{ project.totalTasks }} tasks</span>
          </div>
        </div>
      </div>

      <!-- Progress Section -->
      <div class="col-2 column justify-center">
        <div class="text-grey-7" style="font-size: 11px; margin-bottom: 2px;">Progress</div>
        <div :class="`text-weight-bold text-${progressColor}`" style="font-size: 14px;">{{ project.progress }}%</div>
        <q-linear-progress :value="project.progress / 100" :color="progressColor" size="4px" class="q-mt-xs rounded-borders" style="width: 80%;" />
      </div>

      <!-- Tasks Section -->
      <div class="col-1 column justify-center">
        <div class="text-grey-7" style="font-size: 11px; margin-bottom: 2px;">Tasks</div>
        <div class="text-weight-bold" style="font-size: 14px;">{{ project.totalTasks }}</div>
        <div class="text-grey-6" style="font-size: 10px;">{{ project.completedTasks }} completed</div>
      </div>

      <!-- Team Section -->
      <div class="col-2 column justify-center">
        <div class="text-grey-7" style="font-size: 11px; margin-bottom: 4px;">Team</div>
        <div class="row items-center">
           <q-avatar v-for="(member, i) in project.team.slice(0, 3)" :key="i" size="26px" class="overlapping-avatar" :style="`margin-left: ${i === 0 ? 0 : '-10px'}; border: 2px solid white;`">
              <img :src="member" />
           </q-avatar>
           <q-avatar v-if="project.team.length > 3" size="26px" color="indigo-1" text-color="indigo" class="overlapping-avatar" style="margin-left: -10px; border: 2px solid white; font-size: 10px; font-weight: bold;">
              +{{ project.team.length - 3 }}
           </q-avatar>
        </div>
      </div>

      <!-- Deadline Section -->
      <div class="col-2 row justify-between items-center">
        <div class="column justify-center">
          <div class="text-grey-7" style="font-size: 11px; margin-bottom: 2px;">Deadline</div>
          <div class="text-weight-bold" style="font-size: 13px;">{{ project.endDate }}</div>
          <div class="text-grey-6" style="font-size: 10px;">{{ project.daysLeft }} days left</div>
        </div>
        <q-btn flat round dense icon="more_vert" color="grey-7" size="10px" class="bg-grey-2 q-mr-sm" />
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  project: any;
}>();

const priorityColor = computed(() => {
  if (props.project.priority === 'High') return 'orange';
  if (props.project.priority === 'Critical') return 'red';
  if (props.project.priority === 'Medium') return 'blue';
  return 'grey';
});

const progressColor = computed(() => {
  if (props.project.progress < 50) return 'orange';
  if (props.project.progress < 80) return 'blue';
  return 'green';
});
</script>

<style scoped>
.overlapping-avatar {
  z-index: 1;
}
.overlapping-avatar:hover {
  z-index: 10;
}
</style>
