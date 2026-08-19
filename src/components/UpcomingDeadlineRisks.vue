<template>
  <div class="bg-white q-pa-md shadow-1" style="border-radius: 12px;">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1 text-weight-bold">Upcoming Deadline Risks</div>
      <q-btn flat dense no-caps color="grey-8" label="View All" size="12px" class="bg-grey-2 q-px-sm rounded-borders" style="font-weight: 500;" />
    </div>

    <div class="column q-gutter-y-md">
      <div v-for="(item, index) in items" :key="index" class="row items-center justify-between no-wrap">
        <div class="row items-center no-wrap flex-1" style="min-width: 0;">
          <q-avatar v-if="item.icon" :color="item.iconColor" :text-color="item.iconTextColor" :icon="item.icon" size="28px" class="q-mr-sm" style="font-size: 14px;" />
          <q-avatar v-else :color="item.iconColor" :text-color="item.iconTextColor" size="28px" class="q-mr-sm" style="font-size: 12px; font-weight: bold;">
            {{ item.letter }}
          </q-avatar>
          <div class="column justify-center" style="min-width: 0;">
            <div class="text-weight-bold text-grey-9 text-truncate" style="font-size: 12px; line-height: 1.2;">{{ item.task }}</div>
            <div class="text-caption text-grey-6 text-truncate" style="font-size: 10px; line-height: 1.2; margin-top: 2px;">{{ item.project }} • Due in {{ item.days }} days</div>
          </div>
        </div>
        <q-badge :color="item.badgeBg" :text-color="item.badgeText" :label="item.badgeLabel" class="text-weight-bold rounded-borders q-px-sm" style="font-size: 10px; min-width: 50px; display: flex; justify-content: center;" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const items = [
  { task: 'Chart Components', project: 'Internal Analytics Dashboard', days: 3, icon: 'warning', iconColor: 'red-1', iconTextColor: 'red', badgeLabel: 'High', badgeBg: 'red-1', badgeText: 'red' },
  { task: 'User Authentication', project: 'Mobile Banking App', days: 5, icon: 'warning', iconColor: 'orange-1', iconTextColor: 'orange', badgeLabel: 'High', badgeBg: 'red-1', badgeText: 'red' },
  { task: 'User Access Control', project: 'Internal Analytics Dashboard', days: 5, icon: 'warning', iconColor: 'red-1', iconTextColor: 'red', badgeLabel: 'High', badgeBg: 'red-1', badgeText: 'red' },
  { task: 'Product Catalog API', project: 'E-Commerce Platform Redesign', days: 12, letter: 'E', iconColor: 'blue-1', iconTextColor: 'blue', badgeLabel: 'Medium', badgeBg: 'orange-1', badgeText: 'orange' },
  { task: 'Report Generation', project: 'Internal Analytics Dashboard', days: 13, icon: 'work', iconColor: 'green-1', iconTextColor: 'green', badgeLabel: 'Low', badgeBg: 'green-1', badgeText: 'green' }
];
</script>

<style scoped>
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.flex-1 {
  flex: 1 1 0;
}
</style>
