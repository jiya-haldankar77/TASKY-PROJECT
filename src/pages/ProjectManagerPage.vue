<template>
  <q-page class="q-pa-md text-black" style="height: 100vh; max-height: 100vh; min-height: 0 !important; overflow: hidden; display: flex; flex-direction: column;">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md" style="flex: 0 0 auto;">
      <div class="column">
        <div class="text-h5 text-weight-bold">Command Center 👋</div>
        <div class="text-grey-7 text-caption">Overview of what needs your attention today</div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-input v-model="searchQuery" outlined dense rounded bg-color="white" placeholder="Search attention items & logs..." style="width: 250px;">
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
    </div>

    <!-- Summary Cards -->
    <div class="row q-col-gutter-md q-mb-md" style="flex: 0 0 auto;">
      <div class="col-3">
        <StatCard title="At Risk Projects" :value="dashboardStore.stats.atRiskProjects.toString()" color="red" icon="o_warning" caption="Needs immediate attention" />
      </div>
      <div class="col-3">
        <StatCard title="Overloaded Resources" :value="dashboardStore.stats.overloadedResources.toString()" color="orange" icon="o_groups" caption="Working across multiple projects" />
      </div>
      <div class="col-3">
        <StatCard title="Overdue Tasks" :value="dashboardStore.stats.overdueTasks.toString()" color="deep-orange" icon="o_schedule" caption="Past deadline" />
      </div>
      <div class="col-3">
        <StatCard title="Pending Reviews" :value="dashboardStore.stats.pendingReviews.toString()" color="blue" icon="o_rate_review" caption="Daily logs to review" />
      </div>
    </div>

    <!-- Main Grid Rows -->
    <div class="row q-col-gutter-md" style="flex: 1 1 0; min-height: 0;">
       
       <!-- Needs Attention Column (Left) -->
       <div class="col-6" style="height: 100%; display: flex; flex-direction: column;">
         <q-card class="full-height flex column">
           <q-card-section class="bg-red-1 text-red-9 q-pb-sm">
             <div class="row items-center justify-between">
               <div class="row items-center">
                 <q-icon name="warning" size="24px" class="q-mr-sm" />
                 <div class="text-h6 text-weight-bold">Needs Attention</div>
               </div>
               <q-spinner-dots v-if="dashboardStore.loading" size="24px" />
             </div>
             <div class="text-caption">Critical items that require immediate PM action</div>
           </q-card-section>
           
           <q-card-section class="q-pt-none q-px-md q-pb-md" style="flex: 1 1 0; overflow-y: auto;">
             <q-list separator v-if="hasAttentionItems">
               <!-- Delayed Projects -->
               <template v-for="project in filteredAttentionItems.delayedProjects" :key="'proj-'+project.id">
                 <q-item class="q-py-md">
                   <q-item-section avatar>
                     <q-avatar color="red-1" text-color="red" icon="folder" />
                   </q-item-section>
                   <q-item-section>
                     <q-item-label class="text-weight-bold">{{ project.name }} (Project)</q-item-label>
                     <q-item-label caption>Project is delayed by {{ project.days_delayed }} days. {{ project.overdue_tasks }} overdue task(s).</q-item-label>
                   </q-item-section>
                   <q-item-section side>
                     <q-btn unelevated color="red" label="Manage" size="sm" :to="`/dashboard/projects?search=${encodeURIComponent(project.name)}`" />
                   </q-item-section>
                 </q-item>
               </template>
               
               <!-- Overloaded Resources -->
               <template v-for="resource in filteredAttentionItems.overloadedResources" :key="'res-'+resource.id">
                 <q-item class="q-py-md">
                   <q-item-section avatar>
                     <q-avatar>
                       <img :src="resource.avatar || `https://i.pravatar.cc/150?img=${resource.id}`" />
                     </q-avatar>
                   </q-item-section>
                   <q-item-section>
                     <q-item-label class="text-weight-bold">{{ resource.first_name }} {{ resource.last_name }} ({{ resource.role_name }})</q-item-label>
                     <q-item-label caption>Overloaded ({{ resource.utilization }}% capacity) across {{ resource.project_count }} projects.</q-item-label>
                   </q-item-section>
                   <q-item-section side>
                     <q-btn unelevated color="orange" label="Reassign" size="sm" :to="`/dashboard/resources?search=${encodeURIComponent(resource.employee_code)}`" />
                   </q-item-section>
                 </q-item>
               </template>

               <!-- Overdue Tasks -->
               <template v-for="task in filteredAttentionItems.overdueTasks" :key="'task-'+task.id">
                 <q-item class="q-py-md">
                   <q-item-section avatar>
                     <q-avatar color="deep-orange-1" text-color="deep-orange" icon="task" />
                   </q-item-section>
                   <q-item-section>
                     <q-item-label class="text-weight-bold">{{ task.title }} (Task)</q-item-label>
                     <q-item-label caption>Overdue by {{ task.days_overdue }} days. Blocks {{ task.blocking_count }} dependent tasks in {{ task.project_name }}.</q-item-label>
                   </q-item-section>
                   <q-item-section side>
                     <q-btn unelevated outline color="deep-orange" label="View Task" size="sm" :to="`/dashboard/tasks?search=${encodeURIComponent(task.title)}`" />
                   </q-item-section>
                 </q-item>
               </template>
             </q-list>
             
             <div v-else-if="!dashboardStore.loading" class="text-center q-pa-xl text-grey-6">
               <q-icon name="check_circle" size="48px" class="q-mb-sm text-green-4" />
               <div class="text-h6">All clear!</div>
               <div>No items need your immediate attention.</div>
             </div>
           </q-card-section>
         </q-card>
       </div>

       <!-- Daily Progress Review Column (Right) -->
       <div class="col-6" style="height: 100%; display: flex; flex-direction: column;">
         <q-card class="full-height flex column">
           <q-card-section class="bg-blue-1 text-blue-9 q-pb-sm">
             <div class="row items-center justify-between">
               <div class="row items-center">
                 <q-icon name="history" size="24px" class="q-mr-sm" />
                 <div class="text-h6 text-weight-bold">Daily Progress Review</div>
               </div>
               <q-btn flat dense icon="refresh" color="blue-9" @click="dashboardStore.fetchDailyProgress()" :loading="dashboardStore.loading" />
             </div>
             <div class="text-caption">Latest updates from your team across all projects</div>
           </q-card-section>
           
           <q-card-section class="q-pt-none q-px-md q-pb-md bg-grey-1" style="flex: 1 1 0; overflow-y: auto;">
             <template v-if="filteredDailyLogs.length > 0">
               <q-card v-for="log in filteredDailyLogs" :key="log.id" flat bordered class="q-mt-md bg-white">
                 <q-card-section>
                   <div class="row items-center justify-between q-mb-sm">
                     <div class="row items-center">
                       <q-avatar size="24px" class="q-mr-sm">
                         <img :src="log.avatar || `https://i.pravatar.cc/150?img=${log.user_id}`" />
                       </q-avatar>
                       <span class="text-weight-medium">{{ log.first_name }} {{ log.last_name }}</span>
                       <span class="text-grey-7 q-ml-sm text-caption">logged {{ log.hours_spent }}h on</span>
                     </div>
                     <q-badge :color="getStatusColor(log.status)">
                       {{ log.status === 'blocked' ? 'In Progress (Blocked)' : log.status }}
                     </q-badge>
                   </div>
                   <router-link :to="`/dashboard/tasks?search=${encodeURIComponent(log.task_title)}`" class="text-subtitle2 q-mb-xs text-indigo cursor-pointer text-weight-bold" style="text-decoration: none;">
                     {{ log.task_title }}
                     <q-tooltip>View Task Details</q-tooltip>
                   </router-link>
                   <div class="text-caption text-grey-8 bg-grey-2 q-pa-sm rounded-borders q-mt-xs" :class="{ 'border-left-orange': log.status === 'blocked' }">
                     "{{ log.work_completed }}"
                     <div v-if="log.remaining_work" class="q-mt-xs text-italic text-grey-6">Remaining: {{ log.remaining_work }}</div>
                     <div v-if="log.comments" class="q-mt-xs text-weight-medium">Note: {{ log.comments }}</div>
                   </div>
                   <div class="row justify-between items-center q-mt-sm">
                     <router-link :to="`/dashboard/projects?search=${encodeURIComponent(log.project_name)}`" class="text-caption text-indigo cursor-pointer" style="text-decoration: none; font-weight: 500;">
                       <q-icon name="folder" class="q-mr-xs" size="14px"/>{{ log.project_name }}
                       <q-tooltip>View Project Details</q-tooltip>
                     </router-link>
                     <q-btn v-if="log.status === 'blocked'" flat color="primary" label="Acknowledge & Unblock" size="sm" :to="`/dashboard/tasks?search=${encodeURIComponent(log.task_title)}`" />
                   </div>
                 </q-card-section>
               </q-card>
             </template>
             <div v-else-if="!dashboardStore.loading" class="text-center q-pa-xl text-grey-6">
               <q-icon name="history_toggle_off" size="48px" class="q-mb-sm" />
               <div class="text-h6">No logs today</div>
               <div>Team hasn't submitted daily logs yet.</div>
             </div>
           </q-card-section>
         </q-card>
       </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import StatCard from '../components/StatCard.vue';

const router = useRouter();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();

const searchQuery = ref('');

onMounted(() => {
  dashboardStore.loadAll();
});

const logout = () => {
  authStore.logout();
  router.push('/auth/login');
};

const getStatusColor = (status: string) => {
  if (status === 'completed') return 'green';
  if (status === 'blocked') return 'orange';
  if (status === 'in-progress') return 'blue';
  return 'grey';
};

// Search filtering logic
const filteredAttentionItems = computed(() => {
  const query = searchQuery.value.toLowerCase();
  if (!query) return dashboardStore.attentionItems;

  return {
    delayedProjects: dashboardStore.attentionItems.delayedProjects?.filter((p: any) => p.name.toLowerCase().includes(query)) || [],
    overloadedResources: dashboardStore.attentionItems.overloadedResources?.filter((r: any) => 
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(query) || r.role_name.toLowerCase().includes(query)
    ) || [],
    overdueTasks: dashboardStore.attentionItems.overdueTasks?.filter((t: any) => 
      t.title.toLowerCase().includes(query) || t.project_name.toLowerCase().includes(query)
    ) || [],
  };
});

const hasAttentionItems = computed(() => {
  const items = filteredAttentionItems.value;
  return (items.delayedProjects?.length > 0 || items.overloadedResources?.length > 0 || items.overdueTasks?.length > 0);
});

const filteredDailyLogs = computed(() => {
  const query = searchQuery.value.toLowerCase();
  if (!query) return dashboardStore.dailyProgress;
  
  return dashboardStore.dailyProgress.filter((log: any) => 
    `${log.first_name} ${log.last_name}`.toLowerCase().includes(query) ||
    log.task_title.toLowerCase().includes(query) ||
    log.work_completed.toLowerCase().includes(query) ||
    log.project_name.toLowerCase().includes(query)
  );
});
</script>

<style scoped>
.z-top {
  z-index: 10;
}
.border-left-orange {
  border-left: 4px solid #ff9800;
}
</style>
