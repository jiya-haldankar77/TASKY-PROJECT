<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="width: 800px; max-width: 90vw; border-radius: 12px; display: flex; flex-direction: column; max-height: 90vh;">
      
      <!-- Header -->
      <div class="row items-center justify-between bg-grey-1 q-pa-md" style="border-bottom: 1px solid #e0e0e0; flex: 0 0 auto;">
        <div class="row items-center">
          <q-avatar size="48px" class="q-mr-md shadow-1">
            <img :src="resourceStore.currentResource?.avatar || `https://i.pravatar.cc/150?img=${resourceId}`" />
          </q-avatar>
          <div class="column">
            <div class="text-h6 text-weight-bold" style="line-height: 1.2;">
              {{ resourceStore.currentResource?.first_name }} {{ resourceStore.currentResource?.last_name }}
            </div>
            <div class="text-caption text-grey-7" style="font-size: 13px;">
              {{ formatRole(resourceStore.currentResource?.role_name) }} • {{ resourceStore.currentResource?.employee_code }}
            </div>
          </div>
        </div>
        <q-btn icon="close" flat round dense v-close-popup />
      </div>

      <!-- Content -->
      <div class="q-pa-md" style="flex: 1 1 auto; overflow-y: auto;">
        <div v-if="resourceStore.loading" class="flex flex-center q-pa-xl">
          <q-spinner-dots size="40px" color="primary" />
        </div>
        <div v-else-if="resourceStore.currentResource" class="column q-gutter-y-lg">
          
          <!-- Summary Stats -->
          <div class="row q-gutter-md">
            <div class="col bg-blue-1 q-pa-md rounded-borders column items-center justify-center">
              <div class="text-h5 text-weight-bold text-blue-9">{{ resourceStore.currentResource.tasks?.length || 0 }}</div>
              <div class="text-caption text-blue-8">Active Tasks</div>
            </div>
            <div class="col bg-orange-1 q-pa-md rounded-borders column items-center justify-center">
              <div class="text-h5 text-weight-bold text-orange-9">{{ calculateTotalHours(resourceStore.currentResource.workloadByProject) }}h</div>
              <div class="text-caption text-orange-8">Estimated Workload</div>
            </div>
            <div class="col bg-green-1 q-pa-md rounded-borders column items-center justify-center">
              <div class="text-h5 text-weight-bold text-green-9">{{ resourceStore.currentResource.max_hours_per_week || 40 }}h</div>
              <div class="text-caption text-green-8">Max Capacity / Week</div>
            </div>
          </div>

          <!-- Active Tasks Section -->
          <div>
            <div class="text-subtitle1 text-weight-bold q-mb-sm row items-center">
              <q-icon name="list_alt" color="grey-7" size="20px" class="q-mr-xs" />
              Assigned Tasks
            </div>
            <div v-if="!resourceStore.currentResource.tasks || resourceStore.currentResource.tasks.length === 0" class="text-grey-6 bg-grey-1 q-pa-md rounded-borders text-center">
              No active tasks assigned to this resource.
            </div>
            <q-list v-else separator class="bg-white rounded-borders" style="border: 1px solid #e0e0e0;">
              <q-item v-for="task in resourceStore.currentResource.tasks" :key="task.id" class="q-py-md cursor-pointer hover-bg-grey-1" @click="goToTask(task.id)">
                <q-item-section>
                  <q-item-label class="text-weight-bold text-primary">{{ task.title }}</q-item-label>
                  <q-item-label caption class="row items-center q-mt-xs">
                    <q-badge :color="task.project_color || 'indigo'" class="q-mr-sm cursor-pointer" @click.stop="goToProject(task.project_id)">{{ task.project_name }}</q-badge>
                    <span>Deadline: {{ formatDate(task.deadline) }}</span>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="getPriorityColor(task.priority)" :label="task.priority" class="text-weight-bold" />
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Workload Breakdown -->
          <div>
             <div class="text-subtitle1 text-weight-bold q-mb-sm row items-center">
              <q-icon name="pie_chart" color="grey-7" size="20px" class="q-mr-xs" />
              Workload Breakdown by Project
            </div>
            <div v-if="!resourceStore.currentResource.workloadByProject || resourceStore.currentResource.workloadByProject.length === 0" class="text-grey-6 bg-grey-1 q-pa-md rounded-borders text-center">
              No workload data available.
            </div>
            <div v-else class="column q-gutter-y-sm bg-white rounded-borders q-pa-md" style="border: 1px solid #e0e0e0;">
              <div v-for="wp in resourceStore.currentResource.workloadByProject" :key="wp.id" class="row items-center justify-between cursor-pointer hover-bg-grey-1 q-pa-xs rounded-borders" @click="goToProject(wp.id)">
                <div class="row items-center">
                  <div class="q-mr-sm" :style="`width: 12px; height: 12px; border-radius: 50%; background-color: var(--q-${wp.color || 'indigo'})`"></div>
                  <span class="text-weight-medium text-primary">{{ wp.name }}</span>
                </div>
                <div class="text-grey-8 text-weight-bold">{{ Math.round(wp.hours) }}h</div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { useResourceStore } from '../stores/resourceStore';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  resourceId: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);
const resourceStore = useResourceStore();
const router = useRouter();

watch(() => props.modelValue, async (newVal) => {
  if (newVal && props.resourceId) {
    await resourceStore.fetchResourceById(props.resourceId.toString());
  }
});

const formatRole = (role: string) => {
  if (!role) return 'Employee';
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getPriorityColor = (priority: string) => {
  const map: Record<string, string> = {
    'critical': 'red',
    'high': 'orange',
    'medium': 'blue',
    'low': 'green'
  };
  return map[priority] || 'grey';
};

const calculateTotalHours = (workload: any[]) => {
  if (!workload) return 0;
  return Math.round(workload.reduce((sum, wp) => sum + Number(wp.hours), 0));
};

const goToTask = (taskId: string) => {
  emit('update:modelValue', false);
  router.push(`/dashboard/tasks?open=${taskId}`);
};

const goToProject = (projectId: string) => {
  emit('update:modelValue', false);
  router.push(`/dashboard/projects?open=${projectId}`);
};
</script>

<style scoped>
.hover-bg-grey-1:hover {
  background-color: #f5f5f5 !important;
}
</style>
