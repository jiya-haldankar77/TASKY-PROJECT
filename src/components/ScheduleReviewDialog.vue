<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 600px">
      <q-card-section>
        <div class="text-h6">Review Schedule Changes</div>
        <div class="text-caption text-grey">Triggered by: {{ event?.trigger_type }}</div>
      </q-card-section>

      <q-card-section v-if="event && event.payload">
        <q-list bordered separator>
          <q-item v-for="change in JSON.parse(event.payload)" :key="change.task_id">
            <q-item-section>
              <q-item-label>Task ID: {{ change.task_id }}</q-item-label>
              <q-item-label caption>
                Old Window: {{ change.old_start || 'N/A' }} ➡ {{ change.old_end || 'N/A' }}
              </q-item-label>
              <q-item-label class="text-primary text-weight-bold">
                New Window: {{ change.new_start }} ➡ {{ change.new_end }}
              </q-item-label>
              <q-item-label caption class="text-italic">{{ change.reason }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Reject" color="negative" @click="rejectEvent" />
        <q-btn label="Confirm All" color="primary" @click="confirmEvent" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useQuasar } from 'quasar';

const props = defineProps({
  modelValue: Boolean,
  event: Object,
});

const emit = defineEmits(['update:modelValue', 'confirmed', 'rejected']);

const $q = useQuasar();
const isOpen = ref(props.modelValue);

watch(() => props.modelValue, (val) => {
  isOpen.value = val;
});

watch(isOpen, (val) => {
  emit('update:modelValue', val);
});

async function confirmEvent() {
  if (!props.event) return;
  try {
    const authStore = useAuthStore();
    await fetch(`http://localhost:3001/api/pm/schedule/queue/${props.event.id}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    $q.notify({ type: 'positive', message: 'Schedule changes confirmed' });
    emit('confirmed');
    isOpen.value = false;
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'Failed to confirm changes' });
  }
}

async function rejectEvent() {
  if (!props.event) return;
  try {
    const authStore = useAuthStore();
    await fetch(`http://localhost:3001/api/pm/schedule/queue/${props.event.id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    $q.notify({ type: 'info', message: 'Schedule changes rejected' });
    emit('rejected');
    isOpen.value = false;
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'Failed to reject changes' });
  }
}
</script>
