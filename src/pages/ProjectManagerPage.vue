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
        <q-btn v-if="pendingRescheduleCount > 0" color="orange" icon="event" outline round @click="showScheduleReview = true">
          <q-badge color="red" floating>{{ pendingRescheduleCount }}</q-badge>
          <q-tooltip>Pending Reschedule Reviews</q-tooltip>
        </q-btn>
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
      <q-tab name="insights" label="Insights" icon="insights" />
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
                  <div class="row items-center q-gutter-sm"><q-input v-model="searchQuery" outlined dense bg-color="white" placeholder="Search attention..." class="attention-search"><template v-slot:prepend><q-icon name="search" /></template></q-input><q-spinner-dots v-if="dashboardStore.loading" size="24px" /></div>
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
                <q-tab name="project" :label="`Projects (${dashboardStore.stats?.atRiskProjects ?? 0})`" />
                <q-tab name="employee" :label="`Employees (${dashboardStore.stats?.overloadedResources ?? 0})`" />
                <q-tab name="task" :label="`Tasks (${dashboardStore.stats?.overdueTasks ?? 0})`" />
              </q-tabs>
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
                    <q-badge color="orange" class="q-ml-sm" rounded>
                      {{ dashboardStore.stats?.pendingReviews ?? 0 }} Reviews Pending
                    </q-badge>
                  </div>
                  <div class="row items-center q-gutter-sm"><q-input v-model="teamSearchQuery" outlined dense bg-color="white" placeholder="Search team..." class="team-search"><template v-slot:prepend><q-icon name="search" /></template></q-input><q-spinner-dots v-if="dashboardStore.loading" size="24px" /></div>
                </div>
                <div class="text-caption">All users in your organization</div>
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
                      <div class="column items-end q-gutter-xs" style="min-width: 120px">
                        <q-badge :color="user.access_level === 'manager' ? 'orange' : 'blue'">
                          {{ user.access_level === 'manager' ? 'Manager' : 'Employee' }}
                        </q-badge>
                        <div class="row items-center no-wrap full-width">
                          <q-linear-progress
                            :value="Math.min(Number(user.points || 0), 100) / 100"
                            color="primary"
                            track-color="grey-3"
                            rounded
                            size="6px"
                            class="col"
                          />
                          <span class="text-caption text-grey-7 q-ml-xs">{{ Number(user.points || 0) }} pts</span>
                        </div>
                        <div class="text-caption text-grey-6">Performance points</div>
                      </div>
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

      <!-- Insights Tab -->
<q-tab-panel name="insights" class="q-pa-none insights-panel">
  <div class="insights-container">

    <!-- Insights Header -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Project Insights</div>
        <div class="text-caption text-grey-7">
          Performance overview and areas that need your attention
        </div>
      </div>

      <q-chip
        color="indigo-1"
        text-color="indigo-9"
        icon="auto_awesome"
        label="Live Dashboard"
      />
    </div>

    <!-- KPI Cards -->
    <div class="row q-col-gutter-md q-mb-md">

      <!-- Project Health -->
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card class="insight-kpi-card">
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="insight-icon bg-red-1 text-red">
                <q-icon name="folder" size="24px" />
              </div>
              <q-icon
                :name="atRiskProjects > 0 ? 'trending_up' : 'check_circle'"
                :color="atRiskProjects > 0 ? 'red' : 'green'"
                size="22px"
              />
            </div>

            <div class="text-caption text-grey-7 q-mt-md">
              Projects at Risk
            </div>

            <div class="text-h3 text-weight-bold q-mt-xs">
              {{ atRiskProjects }}
            </div>

            <div class="text-caption text-grey-6">
              {{ projectHealthMessage }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Overdue Tasks -->
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card class="insight-kpi-card">
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="insight-icon bg-orange-1 text-orange">
                <q-icon name="schedule" size="24px" />
              </div>
              <q-icon
                :name="overdueTasks > 0 ? 'warning' : 'check_circle'"
                :color="overdueTasks > 0 ? 'orange' : 'green'"
                size="22px"
              />
            </div>

            <div class="text-caption text-grey-7 q-mt-md">
              Overdue Tasks
            </div>

            <div class="text-h3 text-weight-bold q-mt-xs">
              {{ overdueTasks }}
            </div>

            <div class="text-caption text-grey-6">
              {{ overdueTaskMessage }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Team Capacity -->
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card class="insight-kpi-card">
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="insight-icon bg-blue-1 text-blue">
                <q-icon name="groups" size="24px" />
              </div>
              <q-icon
                :name="overloadedResources > 0 ? 'priority_high' : 'check_circle'"
                :color="overloadedResources > 0 ? 'orange' : 'green'"
                size="22px"
              />
            </div>

            <div class="text-caption text-grey-7 q-mt-md">
              Overloaded Employees
            </div>

            <div class="text-h3 text-weight-bold q-mt-xs">
              {{ overloadedResources }}
            </div>

            <div class="text-caption text-grey-6">
              {{ teamCapacityMessage }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Pending Reviews -->
      <div class="col-12 col-sm-6 col-lg-3">
        <q-card class="insight-kpi-card">
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="insight-icon bg-purple-1 text-purple">
                <q-icon name="rate_review" size="24px" />
              </div>
              <q-icon
                :name="pendingReviews > 0 ? 'pending_actions' : 'check_circle'"
                :color="pendingReviews > 0 ? 'purple' : 'green'"
                size="22px"
              />
            </div>

            <div class="text-caption text-grey-7 q-mt-md">
              Pending Reviews
            </div>

            <div class="text-h3 text-weight-bold q-mt-xs">
              {{ pendingReviews }}
            </div>

            <div class="text-caption text-grey-6">
              {{ reviewMessage }}
            </div>
          </q-card-section>
        </q-card>
      </div>

    </div>

    <!-- Main Analytics Row -->
    <div class="row q-col-gutter-md q-mb-md">

      <!-- Project Health -->
      <div class="col-12 col-md-6">
        <q-card class="insight-large-card">
          <q-card-section>
            <div class="row items-center">
              <q-avatar
                color="indigo-1"
                text-color="indigo"
                icon="monitor_heart"
                size="42px"
                class="q-mr-md"
              />

              <div>
                <div class="text-h6 text-weight-bold">
                  Project Health
                </div>
                <div class="text-caption text-grey-7">
                  Current project risk distribution
                </div>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>

            <!-- Healthy -->
            <div class="q-mb-lg">
              <div class="row justify-between items-center q-mb-xs">
                <div class="row items-center">
                  <q-icon
                    name="check_circle"
                    color="green"
                    size="18px"
                    class="q-mr-sm"
                  />
                  <span class="text-weight-medium">Healthy</span>
                </div>

                <span class="text-weight-bold">
                  {{ healthyProjects }}
                </span>
              </div>

              <q-linear-progress
                :value="projectHealthPercentage(healthyProjects)"
                color="green"
                track-color="grey-3"
                rounded
                size="10px"
              />
            </div>

            <!-- At Risk -->
            <div class="q-mb-lg">
              <div class="row justify-between items-center q-mb-xs">
                <div class="row items-center">
                  <q-icon
                    name="warning"
                    color="orange"
                    size="18px"
                    class="q-mr-sm"
                  />
                  <span class="text-weight-medium">At Risk</span>
                </div>

                <span class="text-weight-bold">
                  {{ atRiskProjects }}
                </span>
              </div>

              <q-linear-progress
                :value="projectHealthPercentage(atRiskProjects)"
                color="orange"
                track-color="grey-3"
                rounded
                size="10px"
              />
            </div>

            <!-- Delayed -->
            <div>
              <div class="row justify-between items-center q-mb-xs">
                <div class="row items-center">
                  <q-icon
                    name="error"
                    color="red"
                    size="18px"
                    class="q-mr-sm"
                  />
                  <span class="text-weight-medium">Delayed</span>
                </div>

                <span class="text-weight-bold">
                  {{ delayedProjects }}
                </span>
              </div>

              <q-linear-progress
                :value="projectHealthPercentage(delayedProjects)"
                color="red"
                track-color="grey-3"
                rounded
                size="10px"
              />
            </div>

          </q-card-section>
        </q-card>
      </div>

      <!-- Task Delivery -->
      <div class="col-12 col-md-6">
        <q-card class="insight-large-card">
          <q-card-section>
            <div class="row items-center">
              <q-avatar
                color="blue-1"
                text-color="blue"
                icon="task_alt"
                size="42px"
                class="q-mr-md"
              />

              <div>
                <div class="text-h6 text-weight-bold">
                  Delivery Overview
                </div>
                <div class="text-caption text-grey-7">
                  Tasks requiring delivery attention
                </div>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>

            <div class="row q-col-gutter-md">

              <div class="col-4">
                <div class="delivery-stat bg-green-1">
                  <q-icon
                    name="check_circle"
                    color="green"
                    size="28px"
                  />
                  <div class="text-h5 text-weight-bold q-mt-sm">
                    {{ completedTasks.length }}
                  </div>
                  <div class="text-caption text-grey-7">
                    Completed
                  </div>
                </div>
              </div>

              <div class="col-4">
                <div class="delivery-stat bg-blue-1">
                  <q-icon
                    name="pending"
                    color="blue"
                    size="28px"
                  />
                  <div class="text-h5 text-weight-bold q-mt-sm">
                    {{ inProgressTasks }}
                  </div>
                  <div class="text-caption text-grey-7">
                    In Progress
                  </div>
                </div>
              </div>

              <div class="col-4">
                <div class="delivery-stat bg-red-1">
                  <q-icon
                    name="priority_high"
                    color="red"
                    size="28px"
                  />
                  <div class="text-h5 text-weight-bold q-mt-sm">
                    {{ overdueTasks }}
                  </div>
                  <div class="text-caption text-grey-7">
                    Overdue
                  </div>
                </div>
              </div>

            </div>

            <q-banner
              rounded
              class="bg-orange-1 text-orange-9 q-mt-lg"
              v-if="overdueTasks > 0"
            >
              <template v-slot:avatar>
                <q-icon name="warning" color="orange" />
              </template>

              <div class="text-weight-medium">
                Delivery risk detected
              </div>

              <div class="text-caption">
                {{ overdueTasks }} task(s) are currently overdue.
                Review them before they impact dependent work.
              </div>
            </q-banner>

            <q-banner
              rounded
              class="bg-green-1 text-green-9 q-mt-lg"
              v-else
            >
              <template v-slot:avatar>
                <q-icon name="check_circle" color="green" />
              </template>

              <div class="text-weight-medium">
                Delivery is on track
              </div>

              <div class="text-caption">
                There are currently no overdue tasks.
              </div>
            </q-banner>

          </q-card-section>
        </q-card>
      </div>

    </div>

    <!-- Bottom Row -->
    <div class="row q-col-gutter-md">

      <!-- Team Capacity -->
      <div class="col-12 col-md-6">
        <q-card class="insight-large-card">
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="row items-center">
                <q-avatar
                  color="orange-1"
                  text-color="orange"
                  icon="groups"
                  size="42px"
                  class="q-mr-md"
                />

                <div>
                  <div class="text-h6 text-weight-bold">
                    Team Capacity
                  </div>
                  <div class="text-caption text-grey-7">
                    Workload distribution across employees
                  </div>
                </div>
              </div>

              <div class="text-h5 text-weight-bold">
                {{ overloadedResources }}
                <span class="text-caption text-grey-6">
                  overloaded
                </span>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div
              v-if="dashboardStore.attentionItems.overloadedResources.length"
            >
              <div
                v-for="resource in dashboardStore.attentionItems.overloadedResources.slice(0, 5)"
                :key="resource.id"
                class="capacity-row"
              >
                <q-avatar size="38px" class="q-mr-md">
                  <img
                    :src="
                      resource.avatar ||
                      `https://i.pravatar.cc/150?img=${resource.id}`
                    "
                  />
                </q-avatar>

                <div class="col">
                  <div class="row justify-between">
                    <div class="text-weight-medium">
                      {{ resource.first_name }}
                      {{ resource.last_name }}
                    </div>

                    <div
                      class="text-weight-bold"
                      :class="
                        resource.utilization >= 100
                          ? 'text-red'
                          : 'text-orange'
                      "
                    >
                      {{ resource.utilization }}%
                    </div>
                  </div>

                  <q-linear-progress
                    :value="Math.min(resource.utilization / 100, 1)"
                    :color="
                      resource.utilization >= 100
                        ? 'red'
                        : 'orange'
                    "
                    track-color="grey-3"
                    rounded
                    size="8px"
                    class="q-mt-xs"
                  />

                  <div class="text-caption text-grey-6 q-mt-xs">
                    {{ resource.project_count }} active project(s)
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else
              class="text-center q-pa-lg text-grey-6"
            >
              <q-icon
                name="check_circle"
                size="42px"
                color="green-4"
              />
              <div class="text-subtitle1 q-mt-sm">
                Team capacity looks healthy
              </div>
              <div class="text-caption">
                No overloaded employees detected.
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Priority Actions -->
      <div class="col-12 col-md-6">
        <q-card class="insight-large-card">
          <q-card-section>
            <div class="row items-center">
              <q-avatar
                color="red-1"
                text-color="red"
                icon="priority_high"
                size="42px"
                class="q-mr-md"
              />

              <div>
                <div class="text-h6 text-weight-bold">
                  Recommended Actions
                </div>
                <div class="text-caption text-grey-7">
                  Areas that deserve your attention
                </div>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>

            <q-item
              v-if="overdueTasks > 0"
              class="action-item bg-red-1 q-mb-sm"
            >
              <q-item-section avatar>
                <q-icon
                  name="schedule"
                  color="red"
                  size="28px"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-bold">
                  Review overdue tasks
                </q-item-label>

                <q-item-label caption>
                  {{ overdueTasks }} task(s) have missed their deadlines.
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  flat
                  round
                  icon="arrow_forward"
                  color="red"
                  to="/dashboard/tasks"
                />
              </q-item-section>
            </q-item>

            <q-item
              v-if="atRiskProjects > 0"
              class="action-item bg-orange-1 q-mb-sm"
            >
              <q-item-section avatar>
                <q-icon
                  name="warning"
                  color="orange"
                  size="28px"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-bold">
                  Intervene in at-risk projects
                </q-item-label>

                <q-item-label caption>
                  {{ atRiskProjects }} project(s) may require
                  management intervention.
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  flat
                  round
                  icon="arrow_forward"
                  color="orange"
                  to="/dashboard/projects"
                />
              </q-item-section>
            </q-item>

            <q-item
              v-if="overloadedResources > 0"
              class="action-item bg-blue-1 q-mb-sm"
            >
              <q-item-section avatar>
                <q-icon
                  name="groups"
                  color="blue"
                  size="28px"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-bold">
                  Balance team workload
                </q-item-label>

                <q-item-label caption>
                  {{ overloadedResources }} employee(s) are
                  above their workload capacity.
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  flat
                  round
                  icon="arrow_forward"
                  color="blue"
                  to="/dashboard/resources"
                />
              </q-item-section>
            </q-item>

            <q-item
              v-if="pendingReviews > 0"
              class="action-item bg-purple-1"
            >
              <q-item-section avatar>
                <q-icon
                  name="rate_review"
                  color="purple"
                  size="28px"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-bold">
                  Complete pending reviews
                </q-item-label>

                <q-item-label caption>
                  {{ pendingReviews }} review(s) are waiting
                  for manager action.
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  flat
                  round
                  icon="arrow_forward"
                  color="purple"
                />
              </q-item-section>
            </q-item>

            <div
              v-if="
                overdueTasks === 0 &&
                atRiskProjects === 0 &&
                overloadedResources === 0 &&
                pendingReviews === 0
              "
              class="text-center q-pa-lg"
            >
              <q-icon
                name="verified"
                color="green"
                size="52px"
              />

              <div class="text-h6 text-weight-bold q-mt-sm">
                Everything looks good
              </div>

              <div class="text-caption text-grey-6">
                No immediate management actions are required.
              </div>
            </div>

          </q-card-section>
        </q-card>
      </div>

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

    <!-- Schedule Review Dialog -->
    <ScheduleReviewDialog 
      v-if="pendingScheduleEvent" 
      v-model="showScheduleReview" 
      :event="pendingScheduleEvent" 
      @confirmed="fetchPendingReschedules" 
      @rejected="fetchPendingReschedules" 
    />

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
import EmployeePerformanceReport from '../components/EmployeePerformanceReport.vue';
import ScheduleReviewDialog from '../components/ScheduleReviewDialog.vue';
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
  fetchPendingReschedules();
});

const showScheduleReview = ref(false);
const pendingScheduleEvent = ref(null);
const pendingRescheduleCount = ref(0);

async function fetchPendingReschedules() {
  try {
    const res = await fetch('http://localhost:3001/api/pm/schedule/queue', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    const data = await res.json();
    if (data.success && data.events.length > 0) {
      pendingRescheduleCount.value = data.events.length;
      pendingScheduleEvent.value = data.events[0]; // get oldest
    } else {
      pendingRescheduleCount.value = 0;
      pendingScheduleEvent.value = null;
      showScheduleReview.value = false;
    }
  } catch (err) {
    console.error('Failed to fetch reschedules', err);
  }
}



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

const atRiskProjects = computed(
  () => dashboardStore.stats?.atRiskProjects ?? 0,
);

const overloadedResources = computed(
  () => dashboardStore.stats?.overloadedResources ?? 0,
);

const overdueTasks = computed(
  () => dashboardStore.stats?.overdueTasks ?? 0,
);

const pendingReviews = computed(
  () => dashboardStore.stats?.pendingReviews ?? 0,
);

const delayedProjects = computed(
  () => dashboardStore.attentionItems.delayedProjects.length,
);

const healthyProjects = computed(() => {
  const total =
    atRiskProjects.value +
    delayedProjects.value;

  // If the backend doesn't expose total project count,
  // use the number of projects we can currently identify.
  const identifiableProjects =
    total + delayedProjects.value;

  return Math.max(0, identifiableProjects - total);
});

const inProgressTasks = computed(() => {
  const totalUsers = dashboardStore.users?.length ?? 0;

  // Keep this useful even when the backend doesn't expose
  // a dedicated in-progress statistic.
  return Math.max(
    0,
    totalUsers - overdueTasks.value,
  );
});

const projectHealthMessage = computed(() => {
  if (atRiskProjects.value === 0 && delayedProjects.value === 0) {
    return 'No projects currently flagged';
  }

  return `${atRiskProjects.value + delayedProjects.value} project(s) need attention`;
});

const overdueTaskMessage = computed(() => {
  if (overdueTasks.value === 0) {
    return 'All tracked tasks are on schedule';
  }

  return 'Tasks requiring delivery attention';
});

const teamCapacityMessage = computed(() => {
  if (overloadedResources.value === 0) {
    return 'No overloaded team members';
  }

  return 'Consider redistributing workload';
});

const reviewMessage = computed(() => {
  if (pendingReviews.value === 0) {
    return 'No reviews waiting';
  }

  return 'Reviews waiting for action';
});

function projectHealthPercentage(value: number) {
  const total =
    healthyProjects.value +
    atRiskProjects.value +
    delayedProjects.value;

  if (total === 0) return 0;

  return value / total;
}

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

/* =========================
   INSIGHTS
   ========================= */

.insights-panel {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 32px;
}

.insights-container {
  min-height: 100%;
}

.insight-kpi-card {
  height: 100%;
  border-radius: 14px;
  border: 1px solid #e5eaf0;
  box-shadow: 0 6px 18px rgba(32, 54, 83, 0.05);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.insight-kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(32, 54, 83, 0.09);
}

.insight-large-card {
  height: 100%;
  min-height: 280px;
  border-radius: 14px;
  border: 1px solid #e5eaf0;
  box-shadow: 0 6px 18px rgba(32, 54, 83, 0.05);
}

.insight-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delivery-stat {
  min-height: 120px;
  border-radius: 12px;
  padding: 18px;
  text-align: center;
}

.capacity-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
}

.capacity-row + .capacity-row {
  border-top: 1px solid #edf0f4;
}

.action-item {
  border-radius: 12px;
  min-height: 78px;
}

@media (max-width: 900px) {
  .insight-large-card {
    min-height: auto;
  }
}
</style>
