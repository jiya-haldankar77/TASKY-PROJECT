<template>
  <q-page class="q-pa-md text-black" style="height: 100vh; max-height: 100vh; min-height: 0 !important; display: flex; flex-direction: column; background-color: #f8f9fa;">
    <!-- Header -->
    <div class="row items-start justify-between q-mb-md" style="flex: 0 0 auto;">
      <div class="row items-center">
        <q-avatar color="indigo-1" text-color="indigo" icon="o_folder" size="48px" class="q-mr-md" style="border-radius: 12px;" />
        <div class="column">
          <div class="text-h5 text-weight-bold">Projects</div>
          <div class="text-grey-7 text-caption">Manage and track all your projects in one place</div>
        </div>
      </div>
      <div class="column items-end">
        <div class="row items-center q-gutter-md q-mb-md">
          <q-avatar size="36px">
            <img src="https://cdn.quasar.dev/img/avatar.png" />
          </q-avatar>
        </div>
        <q-btn unelevated color="indigo" icon="add" label="New Project" no-caps class="rounded-borders" />
      </div>
    </div>
    
    <!-- Summary Cards -->
    <div class="row q-col-gutter-md q-mb-lg" style="flex: 0 0 auto;">
      <div class="col-3">
        <StatCard title="Total Projects" value="3" color="indigo" icon="o_folder" caption="3 active" />
      </div>
      <div class="col-3">
        <StatCard title="Overall Progress" value="63%" color="green" icon="o_stars" :progressValue="0.63">
          <template v-slot:caption>
            <q-icon name="arrow_upward" color="green" size="10px" /> <span class="text-green q-mr-xs">12%</span> from last month
          </template>
        </StatCard>
      </div>
      <div class="col-3">
        <StatCard title="At Risk Projects" value="1" color="orange" icon="o_warning" caption="1 needs attention" />
      </div>
      <div class="col-3">
        <StatCard title="Completed Projects" value="0" color="purple" icon="o_check_circle" caption="0 completed" />
      </div>
    </div>

    <!-- Toolbar -->
    <div class="row items-center justify-between q-mb-md" style="flex: 0 0 auto;">
      <q-input v-model="searchQueryList" outlined dense rounded bg-color="white" placeholder="Search projects..." style="width: 250px;">
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <div class="row items-center q-gutter-x-sm">
        <q-select v-model="statusFilter" outlined dense :options="['Filter by Status']" style="width: 160px;" bg-color="white" rounded />
        <q-select v-model="priorityFilter" outlined dense :options="['Filter by Priority']" style="width: 160px;" bg-color="white" rounded />
        <q-select v-model="sortOption" outlined dense :options="['Sort by: Newest']" style="width: 170px;" bg-color="white" rounded />
        
        <q-btn-group flat rounded class="bg-indigo-1 q-ml-sm" style="border-radius: 20px;">
          <q-btn flat dense icon="format_list_bulleted" color="indigo" class="bg-indigo-2 q-px-sm" style="border-radius: 20px;" />
          <q-btn flat dense icon="grid_view" color="grey-7" class="q-px-sm" />
        </q-btn-group>
      </div>
    </div>

    <!-- Project List -->
    <div class="q-mb-md" style="flex: 1 1 0; overflow-y: auto; min-height: 0; padding-right: 4px;">
      <ProjectListCard v-for="project in paginatedProjects" :key="project.id" :project="project" />
    </div>

    <!-- Pagination Footer -->
    <div class="row items-center justify-between text-grey-7" style="flex: 0 0 auto; font-size: 13px;">
      <div>Showing {{ showingStart }} to {{ showingEnd }} of {{ projects.length }} projects</div>
      <div class="row items-center q-gutter-x-sm">
        <span>Rows per page:</span>
        <q-select v-model="rowsPerPage" outlined dense :options="[3, 5, 10]" class="q-mr-md bg-white" style="width: 70px;" rounded @update:model-value="currentPage = 1" />
        <q-btn flat round dense icon="chevron_left" :disable="currentPage === 1" @click="currentPage--" />
        <q-btn v-for="p in totalPages" :key="p" :unelevated="p === currentPage" :flat="p !== currentPage" round dense :color="p === currentPage ? 'indigo-1' : ''" :text-color="p === currentPage ? 'indigo' : 'grey-7'" :label="p" size="12px" @click="currentPage = p" />
        <q-btn flat round dense icon="chevron_right" :disable="currentPage === totalPages" @click="currentPage++" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import StatCard from '../components/StatCard.vue';
import ProjectListCard from '../components/ProjectListCard.vue';

const searchQueryList = ref('');
const statusFilter = ref('Filter by Status');
const priorityFilter = ref('Filter by Priority');
const sortOption = ref('Sort by: Newest');
const rowsPerPage = ref(3);
const currentPage = ref(1);

const projects = ref([
  {
    id: '1',
    name: 'E-Commerce Platform Redesign',
    description: 'Complete overhaul of the existing e-commerce platform with modern UI and improved performance',
    status: 'Active',
    priority: 'High',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    totalTasks: 5,
    completedTasks: 1,
    progress: 65,
    team: ['https://cdn.quasar.dev/img/avatar1.jpg', 'https://cdn.quasar.dev/img/avatar2.jpg', 'https://cdn.quasar.dev/img/avatar3.jpg', 'extra1', 'extra2'],
    daysLeft: 45,
    avatarColor: 'blue',
    avatarLetter: 'E'
  },
  {
    id: '2',
    name: 'Mobile Banking App',
    description: 'Native mobile application for banking services with secure transactions',
    status: 'Active',
    priority: 'Critical',
    startDate: '2024-02-01',
    endDate: '2024-08-15',
    totalTasks: 5,
    completedTasks: 0,
    progress: 40,
    team: ['https://cdn.quasar.dev/img/avatar4.jpg', 'https://cdn.quasar.dev/img/avatar5.jpg', 'https://cdn.quasar.dev/img/avatar6.jpg', 'extra1'],
    daysLeft: 91,
    avatarColor: 'red',
    avatarLetter: 'M'
  },
  {
    id: '3',
    name: 'Internal Analytics Dashboard',
    description: 'Business intelligence dashboard for internal metrics and reporting',
    status: 'Active',
    priority: 'Medium',
    startDate: '2024-03-01',
    endDate: '2024-05-30',
    totalTasks: 5,
    completedTasks: 2,
    progress: 85,
    team: ['https://cdn.quasar.dev/img/avatar1.jpg', 'https://cdn.quasar.dev/img/avatar3.jpg', 'https://cdn.quasar.dev/img/avatar5.jpg', 'extra1', 'extra2'],
    daysLeft: 18,
    avatarColor: 'green',
    avatarLetter: 'I'
  },
  {
    id: '4',
    name: 'Marketing Campaign Launch',
    description: 'Q3 marketing campaign roll-out for new product lines',
    status: 'Active',
    priority: 'Medium',
    startDate: '2024-05-01',
    endDate: '2024-07-31',
    totalTasks: 8,
    completedTasks: 4,
    progress: 50,
    team: ['https://cdn.quasar.dev/img/avatar2.jpg', 'https://cdn.quasar.dev/img/avatar6.jpg'],
    daysLeft: 55,
    avatarColor: 'orange',
    avatarLetter: 'M'
  }
]);

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return projects.value.slice(start, start + rowsPerPage.value);
});

const totalPages = computed(() => Math.max(1, Math.ceil(projects.value.length / rowsPerPage.value)));
const showingStart = computed(() => projects.value.length === 0 ? 0 : (currentPage.value - 1) * rowsPerPage.value + 1);
const showingEnd = computed(() => Math.min(currentPage.value * rowsPerPage.value, projects.value.length));
</script>

<style scoped>
/* Ensure inputs don't have bottom margins from hints */
:deep(.q-field--dense .q-field__bottom) {
  display: none;
}
:deep(.q-field--outlined .q-field__control) {
  padding: 0 12px;
}
</style>
