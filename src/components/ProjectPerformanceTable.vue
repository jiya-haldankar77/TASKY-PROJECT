<template>
  <div class="bg-white q-pa-md shadow-1 q-mb-md" style="border-radius: 12px;">
    <div class="row items-center justify-between q-mb-sm">
      <div class="text-subtitle1 text-weight-bold">Project Performance Summary</div>
      <q-btn flat dense no-caps color="grey-8" label="View All" size="12px" class="bg-grey-2 q-px-sm rounded-borders" style="font-weight: 500;" />
    </div>

    <q-table
      :rows="projects"
      :columns="columns"
      row-key="name"
      flat
      hide-bottom
      dense
    >
      <!-- Project Column -->
      <template v-slot:body-cell-project="props">
        <q-td :props="props">
          <div class="text-weight-bold text-grey-9" style="font-size: 12px;">{{ props.row.name }}</div>
        </q-td>
      </template>

      <!-- Progress Column -->
      <template v-slot:body-cell-progress="props">
        <q-td :props="props">
          <div class="row items-center no-wrap">
            <q-linear-progress :value="props.row.progress / 100" :color="props.row.color" size="4px" class="rounded-borders" style="width: 40px; display: inline-block; vertical-align: middle;" />
            <span class="q-ml-sm text-weight-bold text-grey-8" style="font-size: 10px;" v-if="props.row.progress > 0">{{ props.row.progress }}%</span>
          </div>
        </q-td>
      </template>

      <!-- Completion Rate Column -->
      <template v-slot:body-cell-completionRate="props">
        <q-td :props="props">
          <div class="text-orange text-weight-bold" style="font-size: 12px;">{{ props.row.completionRate }}%</div>
        </q-td>
      </template>

      <!-- At Risk Column -->
      <template v-slot:body-cell-atRisk="props">
        <q-td :props="props">
          <q-badge color="red" text-color="white" :label="props.row.atRisk" class="text-weight-bold rounded-borders" style="font-size: 10px; min-width: 18px; padding: 2px 4px; display: inline-flex; justify-content: center;" />
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import type { QTableProps } from 'quasar';

const columns: QTableProps['columns'] = [
  { name: 'project', label: 'Project', field: 'name', align: 'left' },
  { name: 'totalTasks', label: 'Total Tasks', field: 'totalTasks', align: 'center' },
  { name: 'completed', label: 'Completed', field: 'completed', align: 'center' },
  { name: 'progress', label: 'Progress', field: 'progress', align: 'left' },
  { name: 'completionRate', label: 'Completion Rate', field: 'completionRate', align: 'center' },
  { name: 'atRisk', label: 'At Risk', field: 'atRisk', align: 'center' }
];

const projects = [
  { name: 'E-Commerce Platform Redesign', totalTasks: 5, completed: 1, progress: 20, completionRate: 20, atRisk: 4, color: 'blue' },
  { name: 'Mobile Banking App', totalTasks: 5, completed: 1, progress: 40, completionRate: 20, atRisk: 4, color: 'blue' },
  { name: 'Internal Analytics Dashboard', totalTasks: 5, completed: 2, progress: 0, completionRate: 40, atRisk: 3, color: 'orange' }
];
</script>

<style scoped>
:deep(th) {
  font-weight: 600 !important;
  color: #757575 !important;
  font-size: 10px !important;
  border-bottom: 1px solid #f0f0f0 !important;
}
:deep(td) {
  font-size: 12px !important;
  color: #555;
  border-bottom: 1px solid #f9f9f9 !important;
}
</style>
