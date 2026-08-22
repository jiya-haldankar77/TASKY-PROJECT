<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="width: 500px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEdit ? 'Edit Task' : 'Create New Task' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-select 
            v-model="form.project_id" 
            :options="projectOptions" 
            label="Project *" 
            outlined 
            dense 
            emit-value 
            map-options
            :rules="[val => !!val || 'Project is required']" 
            :disable="isEdit && !!taskToEdit?.project_id"
          />

          <q-input v-model="form.title" label="Task Title *" outlined dense :rules="[val => !!val || 'Title is required']" />
          
          <q-input v-model="form.description" label="Description" type="textarea" outlined dense rows="3" />
          
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-select v-model="form.status" :options="statusOptions" label="Status" outlined dense emit-value map-options />
            </div>
            <div class="col-6">
              <q-select v-model="form.priority" :options="priorityOptions" label="Priority" outlined dense emit-value map-options />
            </div>
          </div>
          
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input v-model="form.estimated_hours" label="Estimated Hours" type="number" outlined dense min="0" />
            </div>
            <div class="col-6">
              <q-input v-model="form.deadline" label="Deadline" type="date" outlined dense stack-label />
            </div>
          </div>
          
          <q-slider
            v-if="isEdit"
            v-model="form.progress"
            :min="0"
            :max="100"
            label
            label-always
            color="primary"
            class="q-mt-lg q-px-md"
          />
          <div v-if="isEdit" class="text-center text-caption text-grey-7 q-mb-md">Progress (%)</div>

          <div class="row justify-end q-mt-lg">
            <q-btn label="Cancel" color="grey" flat v-close-popup class="q-mr-sm" />
            <q-btn :label="isEdit ? 'Save Changes' : 'Create Task'" color="primary" type="submit" :loading="loading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { usePmTaskStore } from '../stores/pmTaskStore';
import { useProjectStore } from '../stores/projectStore';
import { useQuasar } from 'quasar';

const props = defineProps<{
  modelValue: boolean;
  taskToEdit?: any;
}>();

const emit = defineEmits(['update:modelValue', 'saved']);
const $q = useQuasar();
const taskStore = usePmTaskStore();
const projectStore = useProjectStore();

const isOpen = ref(props.modelValue);
const isEdit = ref(false);
const loading = ref(false);

const projectOptions = computed(() => {
  return projectStore.projects.map(p => ({ label: p.name, value: p.id }));
});

const statusOptions = [
  { label: 'Not Started', value: 'not-started' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Blocked', value: 'blocked' },
];

const priorityOptions = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

const form = ref({
  project_id: null as number | null,
  title: '',
  description: '',
  status: 'not-started',
  priority: 'medium',
  progress: 0,
  estimated_hours: null as number | null,
  deadline: ''
});

watch(() => props.modelValue, (val) => {
  isOpen.value = val;
  if (val) {
    if (projectStore.projects.length === 0) {
      projectStore.fetchProjects();
    }
    
    if (props.taskToEdit) {
      isEdit.value = true;
      form.value = {
        project_id: props.taskToEdit.project_id,
        title: props.taskToEdit.title,
        description: props.taskToEdit.description || '',
        status: props.taskToEdit.status,
        priority: props.taskToEdit.priority,
        progress: props.taskToEdit.progress || 0,
        estimated_hours: props.taskToEdit.estimated_hours,
        deadline: props.taskToEdit.deadline ? props.taskToEdit.deadline.split('T')[0] : ''
      };
    } else {
      isEdit.value = false;
      form.value = {
        project_id: projectOptions.value.length > 0 ? projectOptions.value[0]?.value : null,
        title: '',
        description: '',
        status: 'not-started',
        priority: 'medium',
        progress: 0,
        estimated_hours: null,
        deadline: ''
      };
    }
  }
});

watch(isOpen, (val) => {
  emit('update:modelValue', val);
});

const onSubmit = async () => {
  loading.value = true;
  try {
    const payload = { ...form.value };
    if (!payload.deadline) {
      (payload as any).deadline = null;
    }
    
    if (isEdit.value) {
      await taskStore.updateTask(props.taskToEdit.id, payload);
      $q.notify({ type: 'positive', message: 'Task updated successfully' });
    } else {
      await taskStore.createTask(payload);
      $q.notify({ type: 'positive', message: 'Task created successfully' });
    }
    emit('saved');
    isOpen.value = false;
  } catch (error: any) {
    $q.notify({ type: 'negative', message: error.message || 'An error occurred' });
  } finally {
    loading.value = false;
  }
};
</script>
