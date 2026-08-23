<template>
  <q-page class="q-pa-md text-black" style="height: 100vh; max-height: 100vh; min-height: 0 !important; display: flex; flex-direction: column; background-color: #f8f9fa;">
    
    <!-- Header -->
    <div class="row items-start justify-between q-mb-md" style="flex: 0 0 auto;">
      <div class="row items-center">
        <q-avatar color="indigo-1" text-color="indigo" icon="o_groups" size="48px" class="q-mr-md" style="border-radius: 12px;" />
        <div class="column">
          <div class="text-h5 text-weight-bold">Resources & Workload</div>
          <div class="text-grey-7 text-caption">Monitor team capacity, workload, and resource availability</div>
        </div>
      </div>
      <div class="column items-end">
        <div class="row items-center q-gutter-md q-mb-md">
          <q-input v-model="searchQuery" outlined dense rounded bg-color="white" placeholder="Search resources, skills, projects..." style="width: 320px;" @update:model-value="onSearch">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-avatar size="36px" class="cursor-pointer">
            <img :src="authStore.currentUser?.avatar || 'https://cdn.quasar.dev/img/avatar.png'" />
            <q-menu anchor="bottom right" self="top right">
              <q-list style="min-width: 150px">
                <q-item clickable v-close-popup to="/dashboard/profile">
                  <q-item-section avatar><q-icon name="person" /></q-item-section>
                  <q-item-section>Profile</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section avatar><q-icon name="logout" color="red" /></q-item-section>
                  <q-item-section class="text-red">Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-avatar>
        </div>
        <div class="row q-gutter-sm">
          <q-btn unelevated color="teal-6" icon="autorenew" label="Auto Schedule & Rebalance" no-caps class="rounded-borders" @click="handleRebalance" :loading="rebalancing" />
          <q-btn unelevated color="indigo-5" icon="o_file_download" label="Export Report" no-caps class="rounded-borders" />
        </div>
      </div>
    </div>
    
    <!-- Summary Stats -->
    <div class="row q-gutter-x-lg q-mb-md" style="flex: 0 0 auto;">
      <div class="row items-center">
        <q-icon name="o_groups" color="indigo" size="20px" class="q-mr-xs" />
        <div class="text-weight-bold q-mr-sm">{{ resourceStore.resources.length }}</div>
        <div class="text-caption text-grey-7">Total Resources</div>
      </div>
      <div class="row items-center">
        <q-icon name="o_warning_amber" color="red" size="20px" class="q-mr-xs" />
        <div class="text-weight-bold text-red q-mr-sm">{{ overloadedCount }}</div>
        <div class="text-caption text-grey-7">Overloaded (Cross-project)</div>
      </div>
      <div class="row items-center">
        <q-icon name="o_schedule" color="orange" size="20px" class="q-mr-xs" />
        <div class="text-weight-bold text-orange q-mr-sm">{{ avgUtilization }}%</div>
        <div class="text-caption text-grey-7">Avg Utilization</div>
      </div>
    </div>

    <!-- Main Content Split -->
    <div class="row q-col-gutter-md" style="flex: 1 1 0; min-height: 0;">
      <!-- Main Column: Data Table -->
      <div class="col-12" style="height: 100%; display: flex; flex-direction: column; min-height: 0;">
        <ResourceWorkloadTable />
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '../stores/authStore';
import { useResourceStore } from '../stores/resourceStore';
import ResourceWorkloadTable from '../components/ResourceWorkloadTable.vue';

const router = useRouter();
const authStore = useAuthStore();
const resourceStore = useResourceStore();
const $q = useQuasar();

const searchQuery = ref('');
const rebalancing = ref(false);

const handleRebalance = async () => {
  rebalancing.value = true;
  try {
    const res = await resourceStore.rebalanceWorkloads();
    $q.notify({
      type: 'positive',
      message: `Successfully rebalanced workloads. ${res.assignedCount || 0} tasks re-assigned.`
    });
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Error rebalancing workloads'
    });
  } finally {
    rebalancing.value = false;
  }
};

onMounted(() => {
  resourceStore.fetchResources();
  resourceStore.fetchConflicts();
  resourceStore.fetchAvailability();
});

const onSearch = () => {
  resourceStore.fetchResources(searchQuery.value);
};

const logout = () => {
  authStore.logout();
  router.push('/auth/login');
};

const overloadedCount = computed(() => {
  return resourceStore.overloadedResources.length;
});

const avgUtilization = computed(() => {
  if (resourceStore.resources.length === 0) return 0;
  const total = resourceStore.resources.reduce((sum: number, r: any) => sum + (r.utilization || 0), 0);
  return Math.round(total / resourceStore.resources.length);
});
</script>

<style scoped>
/* Scrollbar styling for sidebar */
.col-4::-webkit-scrollbar {
  width: 6px;
}
.col-4::-webkit-scrollbar-track {
  background: transparent; 
}
.col-4::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 4px;
}
.col-4::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; 
}
</style>
