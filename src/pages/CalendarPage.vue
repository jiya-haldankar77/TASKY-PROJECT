<template>
  <q-page class="q-pa-md text-black flex column" style="background-color: #f8f9fa; height: 100vh; max-height: 100vh; min-height: 0 !important;">
    
    <!-- Header -->
    <div class="row items-start justify-between q-mb-md" style="flex: 0 0 auto;">
      <div class="row items-center">
        <q-avatar color="indigo-1" text-color="indigo" icon="o_calendar_view_week" size="48px" class="q-mr-md" style="border-radius: 12px;" />
        <div class="column">
          <div class="text-h5 text-weight-bold">Cross-Project Timeline</div>
          <div class="text-grey-7 text-caption">Visualize task deadlines, resource availability, and milestones</div>
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn-group unelevated class="bg-white border-grey-3">
          <q-btn flat dense no-caps color="grey-8" label="List" class="q-px-md" :class="{'bg-indigo-1 text-indigo text-weight-bold': viewMode === 'list'}" @click="viewMode = 'list'" />
          <q-btn flat dense no-caps color="grey-8" label="Timeline" class="q-px-md" :class="{'bg-indigo-1 text-indigo text-weight-bold': viewMode === 'timeline'}" @click="viewMode = 'timeline'" />
        </q-btn-group>
        <q-btn unelevated color="indigo" icon="add" label="Add Event" no-caps class="rounded-borders" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="bg-white q-pa-md shadow-1" style="border-radius: 12px; flex: 1 1 0; display: flex; flex-direction: column; overflow: hidden;">
      
      <!-- Toolbar -->
      <div class="row items-center justify-between q-mb-md" style="flex: 0 0 auto;">
        <div class="row items-center q-gutter-x-sm">
          <q-btn flat round dense icon="chevron_left" color="grey-8" />
          <div class="text-subtitle1 text-weight-bold q-px-sm">Current Month</div>
          <q-btn flat round dense icon="chevron_right" color="grey-8" />
        </div>
        
        <div class="row items-center q-gutter-x-sm">
          <q-badge color="blue-1" text-color="blue" label="Task Deadline" class="q-pa-xs rounded-borders" />
          <q-badge color="orange-1" text-color="orange" label="Milestone" class="q-pa-xs rounded-borders" />
          <q-badge color="green-1" text-color="green" label="Available" class="q-pa-xs rounded-borders" />
          <q-badge color="red-1" text-color="red" label="Leave" class="q-pa-xs rounded-borders" />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="calendarStore.loading" class="flex flex-center full-height full-width">
        <q-spinner-dots size="40px" color="primary" />
      </div>

      <!-- Events List -->
      <div v-else-if="viewMode === 'list'" class="full-width" style="flex: 1 1 0; overflow-y: auto;">
        <q-list separator>
          <q-item v-for="event in sortedEvents" :key="event.id || Math.random()" class="q-py-md">
            <q-item-section avatar>
              <q-avatar :color="getEventColor(event.type)" text-color="white" :icon="getEventIcon(event.type)" />
            </q-item-section>
            
            <q-item-section>
              <q-item-label class="text-weight-bold text-grey-9">{{ event.title }}</q-item-label>
              <q-item-label caption class="text-grey-7">{{ getEventDescription(event) }}</q-item-label>
            </q-item-section>

            <q-item-section side top>
              <div class="text-weight-medium text-grey-8">{{ formatDate(event.start) }}</div>
              <q-badge v-if="event.status" :color="getStatusColor(event.status)" :label="event.status" outline class="q-mt-xs" />
            </q-item-section>
          </q-item>
        </q-list>
        
        <div v-if="sortedEvents.length === 0" class="flex flex-center full-height text-grey-6 text-subtitle1">
          No events found for this period.
        </div>
      </div>

      <!-- Timeline (Placeholder) -->
      <div v-else class="full-width flex flex-center bg-grey-1" style="flex: 1 1 0; border-radius: 8px; border: 1px dashed #ccc;">
        <div class="text-center">
          <q-icon name="view_timeline" size="64px" color="grey-4" class="q-mb-sm" />
          <div class="text-h6 text-grey-8">Gantt View Coming Soon</div>
          <div class="text-caption text-grey-6">The interactive timeline drag-and-drop feature is under construction.</div>
        </div>
      </div>

    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCalendarStore } from '../stores/calendarStore';
import { date } from 'quasar';

const calendarStore = useCalendarStore();
const viewMode = ref('list');

onMounted(() => {
  calendarStore.fetchCalendarData();
});

const sortedEvents = computed(() => {
  if (!calendarStore.events) return [];
  return [...calendarStore.events].sort((a, b) => {
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
});

const formatDate = (val: string) => {
  if (!val) return 'TBD';
  return date.formatDate(val, 'MMM D, YYYY');
};

const getEventColor = (type: string) => {
  if (type === 'task') return 'blue';
  if (type === 'milestone') return 'orange';
  if (type === 'leave') return 'red';
  if (type === 'availability') return 'green';
  return 'grey';
};

const getEventIcon = (type: string) => {
  if (type === 'task') return 'assignment';
  if (type === 'milestone') return 'flag';
  if (type === 'leave') return 'flight_takeoff';
  if (type === 'availability') return 'event_available';
  return 'event';
};

const getStatusColor = (status: string) => {
  if (status === 'completed') return 'green';
  if (status === 'in-progress') return 'blue';
  if (status === 'blocked') return 'red';
  return 'grey';
};

const getEventDescription = (event: any) => {
  if (event.type === 'task') return `${event.project_name || 'Project'} • Assigned to ${event.assignee_name || 'Unassigned'}`;
  if (event.type === 'leave') return `Resource: ${event.resource_name || 'Unknown'}`;
  return event.description || '';
};
</script>

<style scoped>
.border-grey-3 {
  border: 1px solid #e0e0e0;
}
</style>
