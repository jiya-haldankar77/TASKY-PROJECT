<template>
  <q-dialog v-model="isOpen" maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card class="app-page">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Pending Daily Logs Review</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div v-if="loading" class="flex flex-center q-pa-lg">
          <q-spinner color="primary" size="3em" />
        </div>
        <div v-else-if="pendingLogs.length === 0" class="text-center q-pa-xl text-grey-6">
          <q-icon name="check_circle" size="50px" color="positive" class="q-mb-md" />
          <div class="text-h6">All Caught Up!</div>
          <div>No pending daily logs to review.</div>
        </div>
        <div v-else class="row q-col-gutter-md">
          <div v-for="submission in pendingLogs" :key="submission.id" class="col-12 col-md-6 col-lg-4">
            <q-card flat bordered class="submission-card">
              <q-card-section>
                <div class="row items-center q-mb-md">
                  <q-avatar size="40px" class="q-mr-md">
                    <img :src="submission.avatar || 'https://cdn.quasar.dev/img/avatar.png'" />
                  </q-avatar>
                  <div>
                    <div class="text-weight-bold">{{ submission.first_name }} {{ submission.last_name }}</div>
                    <div class="text-caption text-grey-7">{{ formatDate(submission.log_date) }}</div>
                  </div>
                </div>

                <q-separator class="q-mb-sm" />
                
                <div class="text-caption text-weight-bold q-mb-xs">Work Activity ({{ submission.logs.length }})</div>
                <div class="logs-container">
                  <div v-for="log in submission.logs" :key="log.id" class="log-item q-mb-sm q-pa-sm bg-grey-1 rounded-borders">
                    <div class="row justify-between">
                      <div class="text-weight-medium text-body2">{{ log.task_title || log.work_completed || 'General Task' }}</div>
                      <div class="text-caption text-primary">{{ log.hours_spent }}h</div>
                    </div>
                    <div v-if="log.work_completed && log.work_completed !== log.task_title" class="text-caption text-grey-8 q-mt-xs">
                      {{ log.work_completed }}
                    </div>
                  </div>
                </div>
              </q-card-section>

              <q-card-actions class="q-pa-md bg-grey-1">
                <q-input
                  v-model="reviewComments[submission.id]"
                  outlined
                  dense
                  class="full-width q-mb-sm"
                  placeholder="Add a review comment..."
                  type="textarea"
                  autogrow
                />
                <q-btn
                  unelevated
                  color="primary"
                  class="full-width"
                  label="Submit Review"
                  @click="submitReview(submission)"
                  :disable="!reviewComments[submission.id]"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useQuasar } from 'quasar';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue', 'reviewed']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const authStore = useAuthStore();
const $q = useQuasar();

const pendingLogs = ref<any[]>([]);
const loading = ref(false);
const reviewComments = ref<Record<number, string>>({});

const fetchPendingLogs = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:3001/api/daily-logs/pm/pending');
    const result = await response.json();
    if (result.success) {
      pendingLogs.value = result.pending;
    }
  } catch (err) {
    console.error('Failed to fetch pending logs', err);
  } finally {
    loading.value = false;
  }
};

watch(isOpen, (newVal) => {
  if (newVal) {
    fetchPendingLogs();
  }
});

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const submitReview = async (submission: any) => {
  const comment = reviewComments.value[submission.id];
  if (!comment) return;

  try {
    const response = await fetch('http://localhost:3001/api/daily-logs/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compliance_id: submission.id,
        pm_comment: comment,
        reviewer_id: authStore.user?.id,
        user_id: submission.user_id,
        log_date: submission.log_date
      })
    });
    const result = await response.json();
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: 'Review submitted successfully'
      });
      // Remove from list
      pendingLogs.value = pendingLogs.value.filter(s => s.id !== submission.id);
      emit('reviewed');
    } else {
      $q.notify({
        type: 'negative',
        message: result.message || 'Failed to submit review'
      });
    }
  } catch (err) {
    console.error('Error submitting review', err);
    $q.notify({
      type: 'negative',
      message: 'Server error while submitting review'
    });
  }
};
</script>

<style scoped>
.submission-card {
  border-radius: 12px;
  overflow: hidden;
}
.logs-container {
  max-height: 250px;
  overflow-y: auto;
}
</style>
