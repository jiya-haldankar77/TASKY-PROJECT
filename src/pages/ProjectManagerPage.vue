<template>
  <q-page
    class="q-pa-md text-black"
    style="
      height: 100vh;
      max-height: 100vh;
      min-height: 0 !important;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    "
  >
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md" style="flex: 0 0 auto">
      <div class="column">
        <div class="text-h5 text-weight-bold">Command Center 👋</div>
        <div class="text-grey-7 text-caption">Overview of what needs your attention today</div>
      </div>
      <div class="row items-center q-gutter-sm">
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
    <div class="row q-col-gutter-md q-mb-md" style="flex: 0 0 auto">
      <div class="col-3">
        <StatCard
          title="At Risk Projects"
          :value="String(dashboardStore.stats?.atRiskProjects ?? 0)"
          color="red"
          icon="o_warning"
          caption="Needs immediate attention"
        />
      </div>
      <div class="col-3">
        <StatCard
          title="Overloaded Resources"
          :value="String(dashboardStore.stats?.overloadedResources ?? 0)"
          color="orange"
          icon="o_groups"
          caption="Working across multiple projects"
        />
      </div>
      <div class="col-3">
        <StatCard
          title="Overdue Tasks"
          :value="String(dashboardStore.stats?.overdueTasks ?? 0)"
          color="deep-orange"
          icon="o_schedule"
          caption="Past deadline"
        />
      </div>
      <div class="col-3">
        <StatCard
          title="Pending Reviews"
          :value="String(pendingReviewsCount)"
          color="blue"
          icon="o_rate_review"
          caption="Tasks awaiting final review"
        />
      </div>
    </div>

    <!-- Tabs -->
    <q-tabs
      v-model="activeTab"
      dense
      class="text-grey-7 q-mb-md"
      active-color="primary"
      indicator-color="primary"
      align="left"
      style="flex: 0 0 auto"
    >
      <q-tab name="overview" label="Overview" icon="dashboard" />
      <q-tab name="completed" label="Completed" icon="check_circle" />
    </q-tabs>

    <q-tab-panels
      v-model="activeTab"
      animated
      class="transparent"
      style="flex: 1 1 0; min-height: 0"
    >
      <!-- Overview Tab -->
      <q-tab-panel name="overview" class="q-pa-none">
        <div class="row q-col-gutter-md" style="height: 100%; min-height: 0">
          <!-- Needs Attention Column (Left) -->
          <div class="col-6" style="height: 100%; display: flex; flex-direction: column">
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
              <q-tabs
                v-model="attentionTab"
                dense
                class="text-red-9 bg-red-1"
                active-color="white"
                active-bg-color="red-4"
                indicator-color="transparent"
                align="justify"
                narrow-indicator
              >
                <q-tab name="all" label="All" />
                <q-tab name="project" label="Projects" />
                <q-tab name="employee" label="Employees" />
                <q-tab name="task" label="Tasks" />
              </q-tabs>
              <q-card-section class="q-pb-sm q-pt-sm bg-red-1">
                <q-input v-model="searchQuery" outlined dense bg-color="white" placeholder="Search attention items..." class="attention-search">
                  <template v-slot:prepend><q-icon name="search" /></template>
                </q-input>
              </q-card-section>

              <q-card-section
                class="q-pt-none q-px-md q-pb-md"
                style="flex: 1 1 0; overflow-y: auto"
              >
                <q-list separator v-if="hasAttentionItems">
                  <!-- Delayed Projects -->
                  <template v-if="attentionTab === 'all' || attentionTab === 'project'">
                    <template
                      v-for="project in filteredAttentionItems.delayedProjects"
                      :key="'proj-' + project.id"
                    >
                    <q-item class="q-py-md">
                      <q-item-section avatar>
                        <q-avatar color="red-1" text-color="red" icon="folder" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-bold"
                          >{{ project.name }} (Project)</q-item-label
                        >
                        <q-item-label caption
                          >Project is delayed by {{ project.days_delayed }} days.
                          {{ project.overdue_tasks }} overdue task(s).</q-item-label
                        >
                      </q-item-section>
                      <q-item-section side>
                        <q-btn
                          unelevated
                          color="red"
                          label="Manage"
                          size="sm"
                          :to="`/dashboard/projects?search=${encodeURIComponent(project.name)}`"
                        />
                      </q-item-section>
                    </q-item>
                    </template>
                  </template>

                  <!-- Overloaded Resources -->
                  <template v-if="attentionTab === 'all' || attentionTab === 'employee'">
                    <template
                      v-for="resource in filteredAttentionItems.overloadedResources"
                      :key="'res-' + resource.id"
                    >
                    <q-item class="q-py-md">
                      <q-item-section avatar>
                        <q-avatar>
                          <img
                            :src="resource.avatar || `https://i.pravatar.cc/150?img=${resource.id}`"
                          />
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-bold"
                          >{{ resource.first_name }} {{ resource.last_name }} ({{
                            resource.role_name
                          }})</q-item-label
                        >
                        <q-item-label caption
                          >Overloaded ({{ resource.utilization }}% capacity) across
                          {{ resource.project_count }} projects.</q-item-label
                        >
                      </q-item-section>
                      <q-item-section side>
                        <q-btn
                          unelevated
                          color="orange"
                          label="Reassign"
                          size="sm"
                          :to="`/dashboard/resources?search=${encodeURIComponent(resource.employee_code)}`"
                        />
                      </q-item-section>
                    </q-item>
                    </template>
                  </template>

                  <!-- Overdue Tasks -->
                  <template v-if="attentionTab === 'all' || attentionTab === 'task'">
                    <template
                      v-for="task in filteredAttentionItems.overdueTasks"
                      :key="'task-' + task.id"
                    >
                    <q-item class="q-py-md">
                      <q-item-section avatar>
                        <q-avatar color="deep-orange-1" text-color="deep-orange" icon="task" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-bold"
                          >{{ task.title }} (Task)</q-item-label
                        >
                        <q-item-label caption
                          >Overdue by {{ task.days_overdue }} days. Blocks
                          {{ task.blocking_count }} dependent tasks in
                          {{ task.project_name }}.</q-item-label
                        >
                      </q-item-section>
                      <q-item-section side>
                        <q-btn
                          unelevated
                          outline
                          color="deep-orange"
                          label="View Task"
                          size="sm"
                          :to="`/dashboard/tasks?search=${encodeURIComponent(task.title)}`"
                        />
                      </q-item-section>
                    </q-item>
                    </template>
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

          <!-- Team Members Column (Right) -->
          <div class="col-6" style="height: 100%; display: flex; flex-direction: column">
            <q-card class="full-height flex column">
              <q-card-section class="bg-green-1 text-green-9 q-pb-sm">
                <div class="row items-center justify-between">
                  <div class="row items-center">
                    <q-icon name="groups" size="24px" class="q-mr-sm" />
                    <div class="text-h6 text-weight-bold">Team Members</div>
                  </div>
                  <q-spinner-dots v-if="dashboardStore.loading" size="24px" />
                </div>
                <div class="text-caption">All users in your organization</div>
              </q-card-section>
              <q-card-section class="q-pb-sm q-pt-sm bg-green-1">
                <q-input v-model="teamSearchQuery" outlined dense bg-color="white" placeholder="Search team members..." class="team-search">
                  <template v-slot:prepend><q-icon name="search" /></template>
                </q-input>
              </q-card-section>

              <q-card-section
                class="q-pt-none q-px-md q-pb-md"
                style="flex: 1 1 0; overflow-y: auto"
              >
                <q-list separator v-if="dashboardStore.users.length > 0">
                  <q-item
                    v-for="user in filteredUsers"
                    :key="user.id"
                    class="q-py-md cursor-pointer"
                    clickable
                    @click="showEmployeePerformance(user)"
                  >
                    <q-item-section avatar>
                      <q-avatar>
                        <img :src="user.avatar_url || `https://i.pravatar.cc/150?img=${user.id}`" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-bold"
                        >{{ user.first_name }} {{ user.last_name }}</q-item-label
                      >
                      <q-item-label caption
                        >{{ user.employee_code }} - {{ user.role_name }}</q-item-label
                      >
                      <q-item-label caption v-if="user.email" class="text-grey-7">{{
                        user.email
                      }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge :color="user.access_level === 'manager' ? 'orange' : 'blue'">
                        {{ user.access_level === 'manager' ? 'Manager' : 'Employee' }}
                      </q-badge>
                    </q-item-section>
                  </q-item>
                </q-list>

                <div v-else-if="!dashboardStore.loading" class="text-center q-pa-xl text-grey-6">
                  <q-icon name="person_off" size="48px" class="q-mb-sm" />
                  <div class="text-h6">No users found</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <!-- Completed Tab -->
      <q-tab-panel name="completed" class="q-pa-none">
        <q-card class="full-height">
          <q-card-section class="bg-green-1 text-green-9 q-pb-sm">
            <div class="row items-center justify-between">
              <div class="row items-center">
                <q-icon name="check_circle" size="24px" class="q-mr-sm" />
                <div class="text-h6 text-weight-bold">Completed Tasks</div>
              </div>
              <q-spinner-dots v-if="loadingCompleted" size="24px" />
            </div>
            <div class="text-caption">All completed tasks - click to view review status</div>
          </q-card-section>

          <q-card-section class="q-pt-none q-px-md q-pb-md" style="max-height: calc(100vh - 300px); overflow-y: auto">
            <q-list separator v-if="completedTasks.length > 0">
              <q-item v-for="task in completedTasks" :key="task.id" class="q-py-md" clickable @click="showTaskDetail(task)">
                <q-item-section avatar>
                  <q-icon name="check_circle" color="green" size="32px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ task.title }}</q-item-label>
                  <q-item-label caption>Project: {{ task.project_name }}</q-item-label>
                  <q-item-label caption>Assigned to: {{ task.assigned_first_name }} {{ task.assigned_last_name }}</q-item-label>
                  <q-item-label caption>Progress: {{ task.progress }}%</q-item-label>
                  <q-item-label caption v-if="task.review_status" class="text-purple-8 q-mt-xs">
                    Review: {{ task.review_status }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="column items-end">
                    <q-badge :color="task.review_status === 'review-done' ? 'green' : 'orange'" :label="task.review_status || 'Pending Review'" />
                    <div class="text-caption text-grey-6 q-mt-xs">
                      {{ formatDate(task.completed_at) }}
                    </div>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else-if="!loadingCompleted" class="text-center q-pa-xl text-grey-6">
              <q-icon name="check_circle" size="48px" class="q-mb-sm text-green-4" />
              <div class="text-h6">No completed tasks yet</div>
              <div>Tasks will appear here after they are completed</div>
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Employee Performance Dialog -->
    <EmployeePerformanceReport v-model="showPerformanceDialog" :employee="selectedEmployee" />

    <!-- Task Detail Dialog -->
    <q-dialog v-model="showTaskDetailDialog">
      <q-card style="min-width: 600px">
        <q-card-section>
          <div class="text-h6">Task Details</div>
        </q-card-section>
        <q-card-section class="q-pt-none" v-if="selectedTask">
          <div class="q-mb-md">
            <strong>Task:</strong> {{ selectedTask.title }}
          </div>
          <div class="q-mb-md">
            <strong>Project:</strong> {{ selectedTask.project_name }}
          </div>
          <div class="q-mb-md">
            <strong>Assigned to:</strong> {{ selectedTask.assigned_first_name }} {{ selectedTask.assigned_last_name }}
          </div>
          <div class="q-mb-md">
            <strong>Progress:</strong> {{ selectedTask.progress }}%
          </div>
          <div class="q-mb-md">
            <strong>Completed at:</strong> {{ formatDate(selectedTask.completed_at) }}
          </div>
          <q-separator class="q-my-md" />
          <div class="text-subtitle2 q-mb-md">Review Status</div>
          <div v-if="selectedTask.review_status === 'review-done'" class="q-mb-md">
            <q-badge color="green" label="Review Completed" />
            <div class="q-mt-sm">
              <strong>Reviewed by:</strong> {{ selectedTask.reviewer_name || 'N/A' }}
            </div>
          </div>
          <div v-else class="q-mb-md">
            <q-badge color="orange" label="Pending Review" />
            <div class="q-mt-sm text-grey-6">
              Task is completed but not yet reviewed
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStore } from '../stores/dashboardStore';
import StatCard from '../components/StatCard.vue';
import EmployeePerformanceReport from '../components/EmployeePerformanceReport.vue';
const authStore = useAuthStore();
const { logout } = authStore;
const dashboardStore = useDashboardStore();

const searchQuery = ref('');
const teamSearchQuery = ref('');
const selectedEmployee = ref<any>(null);
const showPerformanceDialog = ref(false);
const activeTab = ref('overview');
const attentionTab = ref('all');
const completedTasks = ref<any[]>([]);
const loadingCompleted = ref(false);
const selectedTask = ref<any>(null);
const showTaskDetailDialog = ref(false);

onMounted(() => {
  console.log('Project Manager Dashboard mounted');
  console.log('Auth store user:', authStore.currentUser);
  console.log('Auth store token:', authStore.token);
  console.log('Auth store authenticated:', authStore.isAuthenticated);
  dashboardStore.loadAll();
  console.log('Users loaded:', dashboardStore.users);
  // Pre-load completed reviews
  fetchCompletedReviews();
});

const pendingReviewsCount = computed(() => 0);
const filteredUsers = computed(() => {
  const query = teamSearchQuery.value.toLowerCase().trim();
  if (!query) return dashboardStore.users;
  return dashboardStore.users.filter((user: any) => `${user.first_name} ${user.last_name} ${user.employee_code} ${user.email || ''} ${user.role_name || ''}`.toLowerCase().includes(query));
});

const filteredAttentionItems = computed(() => {
  const query = searchQuery.value.toLowerCase();
  const delayedProjects = dashboardStore.attentionItems.delayedProjects.filter((p: any) =>
    p.name.toLowerCase().includes(query),
  );
  const overloadedResources = dashboardStore.attentionItems.overloadedResources.filter(
    (r: any) =>
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(query) ||
      r.employee_code.toLowerCase().includes(query),
  );
  const overdueTasks = dashboardStore.attentionItems.overdueTasks.filter((t: any) =>
    t.title.toLowerCase().includes(query),
  );
  return { delayedProjects, overloadedResources, overdueTasks };
});

const hasAttentionItems = computed(() => {
  const d = dashboardStore.attentionItems;
  if (attentionTab.value === 'project') return d.delayedProjects.length > 0;
  if (attentionTab.value === 'employee') return d.overloadedResources.length > 0;
  if (attentionTab.value === 'task') return d.overdueTasks.length > 0;
  return (
    d.delayedProjects.length > 0 ||
    d.overloadedResources.length > 0 ||
    d.overdueTasks.length > 0
  );
});

watch(activeTab, async (newTab: string) => {
  if (newTab === 'completed') {
    await fetchCompletedReviews();
  }
});

async function fetchCompletedReviews() {
  loadingCompleted.value = true;
  try {
    // Fetch all completed tasks with review info
    const response = await fetch('http://localhost:3001/api/pm/tasks/completed');
    const data = await response.json();
    console.log('Completed tasks API response:', data);
    if (data.success) {
      // Fetch review status for each completed task
      const tasksWithReviews = await Promise.all(
        data.tasks.map(async (task: any) => {
          try {
            const reviewResponse = await fetch(`http://localhost:3001/api/pm/tasks/${task.id}/review-status`);
            const reviewData = await reviewResponse.json();
            return {
              ...task,
              review_status: reviewData.success ? reviewData.review_status : null,
              reviewer_name: reviewData.success ? reviewData.reviewer_name : null
            };
          } catch {
            return { ...task, review_status: null, reviewer_name: null };
          }
        })
      );
      completedTasks.value = tasksWithReviews;
      console.log('completedTasks.value set to:', completedTasks.value);
    }
  } catch (error) {
    console.error('Error fetching completed tasks:', error);
  } finally {
    loadingCompleted.value = false;
  }
}

function showTaskDetail(task: any) {
  selectedTask.value = task;
  showTaskDetailDialog.value = true;
}

function formatDate(date: string) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showEmployeePerformance(user: any) {
  console.log('Clicked user for performance report:', user);
  selectedEmployee.value = user;
  showPerformanceDialog.value = true;
}
</script>

<style scoped>
.z-top {
  z-index: 10;
}
.border-left-orange {
  border-left: 4px solid #ff9800;
}
</style>
