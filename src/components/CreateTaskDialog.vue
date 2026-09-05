<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="create-dialog-card" style="width: 540px; max-width: 90vw">
      <q-card-section class="create-dialog-header row items-center q-pb-md">
        <q-avatar color="white" text-color="indigo" icon="add_task" size="42px" class="q-mr-md" />
        <div><div class="text-h6 text-weight-bold">{{ isEdit ? 'Edit Task' : 'Create New Task' }}</div><div class="text-caption text-indigo-1">Turn the next piece of work into a clear action</div></div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-select
            v-model="form.project_id"
            :options="projectOptions"
            label="Project *"
            outlined
            dense
            emit-value
            map-options
            :rules="[(val) => !!val || 'Project is required']"
            :disable="isEdit && !!taskToEdit?.project_id"
          />

          <q-input
            v-model="form.title"
            label="Task Title *"
            outlined
            dense
            :rules="[(val) => !!val || 'Title is required']"
          />

          <q-input
            v-model="form.description"
            label="Description"
            type="textarea"
            outlined
            dense
            rows="3"
          />

          <div class="row q-col-md" style="gap:20px;">
            <div class="col-6">
              <q-select
                v-model="form.status"
                :options="statusOptions"
                label="Status"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
            <div class="col-5">
              <q-select
                v-model="form.priority"
                :options="priorityOptions"
                label="Priority"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
          </div>

          <div class="row q-col-md" style="gap:10px;">
            <div class="col-4">
              <q-input
                v-model="form.expected_effort"
                label="Expected Effort (Hours)"
                type="number"
                outlined
                dense
                min="0"
              />
            </div>
            <div class="col-4">
              <q-input
                v-model="form.resources_needed"
                label="Resources Needed"
                type="number"
                outlined
                dense
                min="1"
                :rules="[(val) => val > 0 || 'Must be > 0']"
              />
            </div>
            <div class="col-3">
              <q-input
                v-model="form.deadline"
                label="Deadline"
                type="date"
                outlined
                dense
                stack-label
                :rules="[(val) => !!val || 'Deadline is required']"
              />
            </div>
          </div>

          <q-select
            v-model="form.assignee_ids"
            :options="resourceOptions"
            label="Assign To *"
            outlined
            dense
            multiple
            use-chips
            emit-value
            map-options
            :rules="[(val) => (val && val.length > 0) || 'Please assign at least one employee']"
            hint="Select employees to assign this task to"
          />



          <div class="row justify-end q-mt-lg">
            <q-btn label="Cancel" color="grey" flat v-close-popup class="q-mr-sm" />
            <q-btn
              :label="isEdit ? 'Save Changes' : 'Create Task'"
              color="primary"
              type="submit"
              :loading="loading"
            />
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
import { useOrgStore } from '../stores/orgStore';
import { useQuasar } from 'quasar';

const props = defineProps<{
  modelValue: boolean;
  taskToEdit?: any;
  initialProjectId?: number | string;
}>();

const emit = defineEmits(['update:modelValue', 'saved']);
const $q = useQuasar();
const taskStore = usePmTaskStore();
const projectStore = useProjectStore();
const orgStore = useOrgStore();

const isOpen = ref(props.modelValue);
const isEdit = ref(false);
const loading = ref(false);

const projectOptions = computed(() => {
  return projectStore.projects.map((p) => ({ label: p.name, value: p.id }));
});

const resourceOptions = computed(() => {
  return orgStore.members.map((m) => ({
    label: `${m.first_name} ${m.last_name} (${m.role_name})`,
    value: m.id,
  }));
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
  expected_effort: null as number | null,
  resources_needed: 1,
  deadline: '',
  assignee_ids: [] as number[],
});

watch(
  () => props.modelValue,
  (val) => {
    isOpen.value = val;
    if (val) {
      // Always fetch projects and members when dialog opens
      projectStore.fetchProjects();
      orgStore.fetchMembers();

      if (props.taskToEdit) {
        isEdit.value = true;
        form.value = {
          project_id: props.taskToEdit.project_id,
          title: props.taskToEdit.title,
          description: props.taskToEdit.description || '',
          status: props.taskToEdit.status,
          priority: props.taskToEdit.priority,
          progress: props.taskToEdit.progress || 0,
          expected_effort: props.taskToEdit.expected_effort,
          resources_needed: props.taskToEdit.resources_needed || 1,
          deadline: props.taskToEdit.deadline ? props.taskToEdit.deadline.split('T')[0] : '',
          assignee_ids: props.taskToEdit.assignees
            ? props.taskToEdit.assignees.map((a: any) => a.id)
            : [],
        };
      } else {
        isEdit.value = false;
        form.value = {
          project_id: props.initialProjectId
            ? Number(props.initialProjectId)
            : projectOptions.value.length > 0
              ? projectOptions.value[0]?.value
              : null,
          title: '',
          description: '',
          status: 'not-started',
          priority: 'medium',
          progress: 0,
          expected_effort: null,
          resources_needed: 1,
          deadline: '',
          assignee_ids: [],
        };
      }
    }
  },
);

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

<style scoped>
.create-dialog-card { border-radius: 18px; overflow: hidden; }
.create-dialog-header { color: white; background: linear-gradient(135deg, #3949ab, #5c6bc0); }
</style>
