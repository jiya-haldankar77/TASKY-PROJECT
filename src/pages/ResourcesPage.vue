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
        <q-btn unelevated color="indigo-5" icon="o_file_download" label="Export Report" no-caps class="rounded-borders" />
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
      <!-- Left Column: Data Table -->
      <div class="col-8" style="height: 100%; display: flex; flex-direction: column;">
        <ResourceWorkloadTable />
      </div>
      
      <!-- Right Column: Sidebar Widgets -->
      <div class="col-4" style="height: 100%; overflow-y: auto; padding-right: 8px;">
        <ResourceConflicts />
        <WorkloadDistribution />
        <TeamAvailability />
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useResourceStore } from '../stores/resourceStore';
import ResourceWorkloadTable from '../components/ResourceWorkloadTable.vue';
import ResourceConflicts from '../components/ResourceConflicts.vue';
import WorkloadDistribution from '../components/WorkloadDistribution.vue';
import TeamAvailability from '../components/TeamAvailability.vue';

const router = useRouter();
const authStore = useAuthStore();
const resourceStore = useResourceStore();

const searchQuery = ref('');

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
