<template>
  <q-page class="q-pa-md text-black" style="height: 100vh; max-height: 100vh; min-height: 0 !important; display: flex; flex-direction: column; background-color: #f8f9fa;">
    
    <!-- Header -->
    <div class="row items-center q-mb-lg" style="flex: 0 0 auto;">
      <q-avatar color="indigo-1" text-color="indigo" icon="settings" size="48px" class="q-mr-md" style="border-radius: 12px;" />
      <div class="column">
        <div class="text-h5 text-weight-bold">Settings</div>
        <div class="text-grey-7 text-caption">Configure scheduling parameters and system preferences</div>
      </div>
    </div>

    <!-- Main Content Layout -->
    <q-card flat bordered class="bg-white" style="flex: 1 1 0; display: flex; flex-direction: row; min-height: 0;">
      
      <!-- Tabs (Left Side) -->
      <div style="width: 250px; border-right: 1px solid #e0e0e0;">
        <q-tabs
          v-model="tab"
          vertical
          class="text-grey-8"
          active-color="indigo"
          active-bg-color="indigo-1"
          indicator-color="indigo"
        >
          <q-tab name="scheduling" icon="schema" label="Scheduling Logic" class="justify-start q-pl-md" />
          <q-tab name="notifications" icon="notifications" label="Notifications" class="justify-start q-pl-md" />
          <q-tab name="account" icon="person" label="Account Security" class="justify-start q-pl-md" />
        </q-tabs>
      </div>

      <!-- Tab Panels (Right Side) -->
      <div style="flex: 1; overflow-y: auto; position: relative;">
        <div v-if="settingsStore.loading" class="absolute-center z-max">
          <q-spinner-dots size="40px" color="primary" />
        </div>
        
        <q-tab-panels
          v-model="tab"
          animated
          swipeable
          vertical
          transition-prev="jump-up"
          transition-next="jump-up"
          class="full-height"
        >
          
          <!-- Scheduling Logic Panel -->
          <q-tab-panel name="scheduling" class="q-pa-xl">
            <div class="text-h6 text-weight-bold q-mb-sm">Resource & Scheduling Constraints</div>
            <div class="text-caption text-grey-7 q-mb-lg">Configure how the system handles cross-project workload and dynamic deadlines.</div>
            
            <q-list class="q-gutter-y-md">
              <q-item tag="label" v-ripple class="bg-grey-1 rounded-borders q-pa-md">
                <q-item-section>
                  <q-item-label class="text-weight-bold">Strict Resource Limits</q-item-label>
                  <q-item-label caption>Prevent assigning tasks to a resource if it pushes them beyond 100% capacity across all projects.</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle color="indigo" v-model="form.strict_resource_limits" />
                </q-item-section>
              </q-item>

              <q-item tag="label" v-ripple class="bg-grey-1 rounded-borders q-pa-md">
                <q-item-section>
                  <q-item-label class="text-weight-bold">Dynamic Deadline Shifting</q-item-label>
                  <q-item-label caption>Automatically adjust subsequent dependent tasks if a current task is completed early or delayed.</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle color="indigo" v-model="form.dynamic_deadline_shifting" />
                </q-item-section>
              </q-item>

              <q-item tag="label" v-ripple class="bg-grey-1 rounded-borders q-pa-md">
                <q-item-section>
                  <q-item-label class="text-weight-bold">High-Priority Interruption Rules</q-item-label>
                  <q-item-label caption>When a Critical task is added, allow it to automatically bump lower-priority tasks on a resource's schedule.</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle color="indigo" v-model="form.priority_bumping" />
                </q-item-section>
              </q-item>
            </q-list>
            
            <q-btn unelevated color="indigo" label="Save Changes" no-caps class="q-mt-xl" @click="saveSettings" :loading="saving" />
          </q-tab-panel>

          <!-- Notifications Panel -->
          <q-tab-panel name="notifications" class="q-pa-xl">
            <div class="text-h6 text-weight-bold q-mb-sm">Alert Preferences</div>
            <div class="text-caption text-grey-7 q-mb-lg">Control what events trigger alerts in your Notification Center.</div>
            
            <q-list class="q-gutter-y-md">
              <q-item tag="label" v-ripple class="bg-grey-1 rounded-borders q-pa-md">
                <q-item-section>
                  <q-item-label class="text-weight-bold">Missing Daily Logs Warning</q-item-label>
                  <q-item-label caption>Alert me when an assigned resource fails to submit their daily progress update.</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle color="blue" v-model="form.alert_missing_logs" />
                </q-item-section>
              </q-item>

              <q-item tag="label" v-ripple class="bg-grey-1 rounded-borders q-pa-md">
                <q-item-section>
                  <q-item-label class="text-weight-bold">Overload Conflicts</q-item-label>
                  <q-item-label caption>Alert me immediately if a cross-project schedule conflict occurs.</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle color="red" v-model="form.alert_conflicts" />
                </q-item-section>
              </q-item>
            </q-list>
            
            <q-btn unelevated color="indigo" label="Save Changes" no-caps class="q-mt-xl" @click="saveSettings" :loading="saving" />
          </q-tab-panel>

          <!-- Account Panel -->
          <q-tab-panel name="account" class="q-pa-xl">
             <div class="text-h6 text-weight-bold q-mb-sm">Account Security</div>
             <div class="text-caption text-grey-7 q-mb-lg">Manage your login credentials.</div>
             
             <div style="max-width: 400px;">
               <q-input outlined v-model="oldPassword" label="Current Password" type="password" class="q-mb-md" />
               <q-input outlined v-model="newPassword" label="New Password" type="password" class="q-mb-md" />
               <q-input outlined v-model="confirmPassword" label="Confirm New Password" type="password" class="q-mb-md" />
               <q-btn unelevated color="indigo" label="Update Password" no-caps @click="updatePassword" :loading="passwordLoading" />
             </div>
          </q-tab-panel>

        </q-tab-panels>
      </div>
      
    </q-card>

  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const settingsStore = useSettingsStore();

const tab = ref('scheduling');
const saving = ref(false);
const passwordLoading = ref(false);

const form = ref({
  strict_resource_limits: false,
  dynamic_deadline_shifting: false,
  priority_bumping: false,
  alert_missing_logs: false,
  alert_conflicts: false
});

const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

onMounted(async () => {
  await settingsStore.fetchSettings();
  if (settingsStore.settings) {
    form.value = { ...settingsStore.settings };
  }
});

watch(() => settingsStore.settings, (newVal) => {
  if (newVal) {
    form.value = { ...newVal };
  }
});

const saveSettings = async () => {
  saving.value = true;
  try {
    await settingsStore.updateSettings(form.value);
    $q.notify({ type: 'positive', message: 'Settings saved successfully' });
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err.message || 'Error saving settings' });
  } finally {
    saving.value = false;
  }
};

const updatePassword = () => {
  if (!oldPassword.value || !newPassword.value) {
    $q.notify({ type: 'warning', message: 'Please fill in all fields' });
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    $q.notify({ type: 'warning', message: 'New passwords do not match' });
    return;
  }
  
  passwordLoading.value = true;
  // This is a stub for password update. In a real app we'd call an API endpoint.
  setTimeout(() => {
    $q.notify({ type: 'positive', message: 'Password updated successfully (stub)' });
    oldPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    passwordLoading.value = false;
  }, 1000);
};
</script>

<style scoped>
/* Scrollbar styling */
.q-tab-panels::-webkit-scrollbar {
  width: 6px;
}
.q-tab-panels::-webkit-scrollbar-track {
  background: transparent; 
}
.q-tab-panels::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 4px;
}
.q-tab-panels::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; 
}
</style>
