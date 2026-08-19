<template>
  <div class="bg-white q-pa-md shadow-1 q-mb-md" style="border-radius: 12px;">
    <div class="text-subtitle1 text-weight-bold q-mb-lg">Task Priority Distribution</div>
    
    <div class="column q-gutter-y-md">
      <div v-for="(item, index) in items" :key="index" class="row items-center no-wrap">
        <div class="text-grey-9 text-weight-medium" style="width: 70px; font-size: 12px;">{{ item.label }}</div>
        <div class="flex-1 q-px-sm" style="flex: 1 1 0;">
          <q-linear-progress :value="item.percent / 100" :color="item.color" size="4px" class="rounded-borders" />
        </div>
        <div class="row justify-end items-center no-wrap" style="width: 60px;">
          <span class="text-weight-bold text-grey-9" style="font-size: 12px;">{{ item.value }}</span>
          <span class="text-grey-6 q-ml-xs" style="font-size: 11px;">({{ item.percent }}%)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const items = [
  { label: 'Critical', value: 3, percent: 20, color: 'red' },
  { label: 'High', value: 7, percent: 47, color: 'orange' },
  { label: 'Medium', value: 4, percent: 27, color: 'blue' },
  { label: 'Low', value: 1, percent: 6, color: 'green' }
];
</script>
