<template>
  <q-page class="q-pa-md text-black" style="height: 100vh; max-height: 100vh; min-height: 0 !important; display: flex; flex-direction: column; background-color: #f8f9fa;">
    
    <!-- Header -->
    <div class="row items-start justify-between q-mb-md" style="flex: 0 0 auto;">
      <div class="row items-center">
        <q-avatar color="indigo-1" text-color="indigo" icon="o_calendar_today" size="48px" class="q-mr-md" style="border-radius: 12px;" />
        <div class="column">
          <div class="text-h5 text-weight-bold">Tasks</div>
          <div class="text-grey-7 text-caption">View and manage all tasks across your projects</div>
        </div>
      </div>
      <div class="column items-end">
        <div class="row items-center q-gutter-md q-mb-md">
          <q-input v-model="searchQuery" outlined dense rounded bg-color="white" placeholder="Search tasks, projects, assignees..." style="width: 320px;">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-avatar size="36px">
            <img src="https://cdn.quasar.dev/img/avatar.png" />
          </q-avatar>
        </div>
        <q-btn unelevated color="indigo" icon="add" label="New Task" no-caps class="rounded-borders" />
      </div>
    </div>
    
    <!-- Summary Cards -->
    <div class="row q-col-gutter-md q-mb-lg" style="flex: 0 0 auto;">
      <div class="col">
        <StatCard title="Total Tasks" value="15" color="indigo" icon="o_calendar_today" caption="All tasks" />
      </div>
      <div class="col">
        <StatCard title="Not Started" value="4" color="blue-grey" icon="o_schedule" caption="27% of total" />
      </div>
      <div class="col">
        <StatCard title="In Progress" value="6" color="orange" icon="o_play_circle_outline" caption="40% of total" />
      </div>
      <div class="col">
        <StatCard title="Completed" value="4" color="green" icon="o_check_circle" caption="27% of total" />
      </div>
      <div class="col">
        <StatCard title="Overdue" value="3" color="red" icon="o_warning_amber" caption="20% of total" />
      </div>
    </div>

    <!-- Toolbar -->
    <div class="row items-center justify-between q-mb-md" style="flex: 0 0 auto;">
      <div class="row items-center q-gutter-x-sm">
        <q-select v-model="filterProject" outlined dense :options="['Filter by Project']" style="width: 170px;" bg-color="white" rounded>
          <template v-slot:prepend><q-icon name="o_folder" size="18px" /></template>
        </q-select>
        <q-select v-model="filterStatus" outlined dense :options="['Filter by Status']" style="width: 170px;" bg-color="white" rounded>
          <template v-slot:prepend><q-icon name="o_settings" size="18px" /></template>
        </q-select>
        <q-select v-model="filterPriority" outlined dense :options="['Filter by Priority']" style="width: 170px;" bg-color="white" rounded>
          <template v-slot:prepend><q-icon name="o_flag" size="18px" /></template>
        </q-select>
        <q-select v-model="filterAssignee" outlined dense :options="['Filter by Assignee']" style="width: 170px;" bg-color="white" rounded>
          <template v-slot:prepend><q-icon name="o_person" size="18px" /></template>
        </q-select>
      </div>

      <div class="row items-center q-gutter-x-sm">
        <q-btn flat color="grey-7" icon="o_filter_alt_off" label="Clear Filters" no-caps size="sm" class="bg-white rounded-borders q-px-sm" style="border: 1px solid #e0e0e0;" />
        
        <q-btn-group flat rounded class="bg-indigo-1 q-ml-sm" style="border-radius: 20px;">
          <q-btn flat dense icon="format_list_bulleted" color="indigo" class="bg-indigo-2 q-px-sm" style="border-radius: 20px;" />
          <q-btn flat dense icon="grid_view" color="grey-7" class="q-px-sm" />
        </q-btn-group>
      </div>
    </div>

    <!-- Data Table -->
    <TasksTable />

  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import StatCard from '../components/StatCard.vue';
import TasksTable from '../components/TasksTable.vue';

const searchQuery = ref('');
const filterProject = ref('Filter by Project');
const filterStatus = ref('Filter by Status');
const filterPriority = ref('Filter by Priority');
const filterAssignee = ref('Filter by Assignee');
</script>

<style scoped>
:deep(.q-field--dense .q-field__bottom) {
  display: none;
}
:deep(.q-field--outlined .q-field__control) {
  padding: 0 12px;
}
</style>
