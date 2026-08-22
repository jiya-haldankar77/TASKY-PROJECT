<template>
  <q-dialog v-model="isOpen" position="right" maximized transition-show="slide-left" transition-hide="slide-right">
    <q-card style="width: 600px; max-width: 100vw;" class="full-height column bg-grey-1" v-if="taskStore.currentTask">
      
      <!-- Header -->
      <q-card-section class="bg-white row items-center justify-between q-pa-md shadow-2 z-top" style="flex: 0 0 auto;">
        <div class="row items-center">
          <q-btn flat round dense icon="close" v-close-popup class="q-mr-sm" />
          <div class="column">
            <div class="text-caption text-grey-7 text-uppercase">{{ taskStore.currentTask.project_name }}</div>
            <div class="text-h6 text-weight-bold" style="line-height: 1.2">{{ taskStore.currentTask.title }}</div>
          </div>
        </div>
        
        <div>
          <q-btn flat round dense icon="edit" color="primary" @click="onEdit" />
          <q-btn flat round dense icon="more_vert" color="grey-7">
            <q-menu>
              <q-list style="min-width: 150px">
                <q-item clickable v-close-popup @click="taskStore.deleteTask(taskStore.currentTask.id); isOpen = false;">
                  <q-item-section avatar><q-icon name="delete" size="sm" color="red" /></q-item-section>
                  <q-item-section class="text-red">Delete Task</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-card-section>

      <!-- Main Content -->
      <q-card-section class="q-pa-md" style="flex: 1 1 0; overflow-y: auto;">
        <div class="row q-col-gutter-md">
          
          <!-- Left Column (Details) -->
          <div class="col-8 column q-gutter-y-md">
            
            <q-card flat bordered class="bg-white q-pa-md">
              <div class="text-subtitle2 text-grey-7 q-mb-sm">Description</div>
              <div class="text-body2" style="white-space: pre-wrap;">{{ taskStore.currentTask.description || 'No description provided.' }}</div>
            </q-card>
            
            <q-card flat bordered class="bg-white q-pa-md">
              <div class="row items-center justify-between q-mb-md">
                <div class="text-subtitle2 text-grey-7">Progress</div>
                <div class="text-weight-bold">{{ taskStore.currentTask.progress || 0 }}%</div>
              </div>
              <q-linear-progress :value="(taskStore.currentTask.progress || 0) / 100" :color="getProgressColor(taskStore.currentTask.progress)" size="8px" class="rounded-borders" />
            </q-card>
            
          </div>
          
          <!-- Right Column (Meta info) -->
          <div class="col-4 column q-gutter-y-md">
            
            <q-card flat bordered class="bg-white">
              <q-list dense separator>
                <q-item class="q-py-md">
                  <q-item-section>
                    <q-item-label caption>Status</q-item-label>
                    <q-item-label>
                      <q-badge :color="`${getStatusColor(taskStore.currentTask.status)}-1`" :text-color="getStatusColor(taskStore.currentTask.status)" :label="formatName(taskStore.currentTask.status)" class="text-weight-bold" />
                    </q-item-label>
                  </q-item-section>
                </q-item>
                
                <q-item class="q-py-md">
                  <q-item-section>
                    <q-item-label caption>Priority</q-item-label>
                    <q-item-label>
                      <q-badge :color="`${getPriorityColor(taskStore.currentTask.priority)}-1`" :text-color="getPriorityColor(taskStore.currentTask.priority)" :label="formatName(taskStore.currentTask.priority)" class="text-weight-bold" />
                    </q-item-label>
                  </q-item-section>
                </q-item>
                
                <q-item class="q-py-md">
                  <q-item-section>
                    <q-item-label caption>Deadline</q-item-label>
                    <q-item-label class="text-weight-medium" :class="{'text-red': isOverdue}">
                      {{ formatDate(taskStore.currentTask.deadline) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
                
                <q-item class="q-py-md">
                  <q-item-section>
                    <q-item-label caption>Estimated Hours</q-item-label>
                    <q-item-label class="text-weight-medium">{{ taskStore.currentTask.estimated_hours || 0 }} hrs</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
            
            <q-card flat bordered class="bg-white q-pa-md">
              <div class="text-subtitle2 text-grey-7 q-mb-sm">Assignees</div>
              <q-list v-if="taskStore.currentTask.assignees && taskStore.currentTask.assignees.length > 0" dense>
                <q-item v-for="assignee in taskStore.currentTask.assignees" :key="assignee.id" class="q-px-none q-py-sm">
                  <q-item-section avatar>
                    <q-avatar size="32px">
                      <img :src="assignee.avatar || `https://i.pravatar.cc/150?img=${assignee.id}`" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ assignee.first_name }} {{ assignee.last_name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="text-caption text-grey">No assignees</div>
            </q-card>

          </div>
        </div>
      </q-card-section>
      
    </q-card>
    
    <q-card v-else class="bg-grey-1 flex flex-center" style="width: 600px; max-width: 100vw;">
      <q-spinner-dots size="40px" color="primary" />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { usePmTaskStore } from '../stores/pmTaskStore';
import { date } from 'quasar';

const props = defineProps<{
  modelValue: boolean;
  taskId?: string;
}>();

const emit = defineEmits(['update:modelValue', 'edit']);
const taskStore = usePmTaskStore();

const isOpen = ref(props.modelValue);

watch(() => props.modelValue, async (val) => {
  isOpen.value = val;
  if (val && props.taskId) {
    await taskStore.fetchTaskById(props.taskId);
  }
});

watch(isOpen, (val) => {
  emit('update:modelValue', val);
  if (!val) {
    taskStore.currentTask = null;
  }
});

const onEdit = () => {
  emit('edit', taskStore.currentTask);
};

const formatName = (val: string) => {
  if (!val) return '';
  return val.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatDate = (val: string) => {
  if (!val) return 'None';
  return date.formatDate(val, 'MMM D, YYYY');
};

const getPriorityColor = (priority: string) => {
  if (priority === 'critical') return 'red';
  if (priority === 'high') return 'orange';
  if (priority === 'medium') return 'blue';
  return 'grey';
};

const getStatusColor = (status: string) => {
  if (status === 'completed') return 'green';
  if (status === 'in-progress') return 'blue';
  if (status === 'blocked') return 'red';
  if (status === 'not-started') return 'grey';
  return 'grey';
};

const getProgressColor = (progress: number) => {
  const p = progress || 0;
  if (p === 100) return 'green';
  if (p >= 50) return 'blue';
  if (p > 0) return 'orange';
  return 'grey-4';
};

const isOverdue = computed(() => {
  if (!taskStore.currentTask) return false;
  if (taskStore.currentTask.status === 'completed') return false;
  if (!taskStore.currentTask.deadline) return false;
  return new Date(taskStore.currentTask.deadline) < new Date(new Date().setHours(0,0,0,0));
});
</script>
