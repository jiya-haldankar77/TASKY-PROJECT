<template>
  <div class="bg-white q-pa-md shadow-1 q-mb-md" style="border-radius: 12px;">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1 text-weight-bold">Resource Conflicts</div>
      <div class="text-indigo text-caption cursor-pointer text-weight-medium">View All</div>
    </div>
    
    <div class="column q-gutter-y-md">
      <div v-for="(conflict, index) in conflicts" :key="index" class="row items-start no-wrap justify-between">
        <div class="row no-wrap">
          <q-icon name="warning" color="red" size="16px" class="q-mr-sm q-mt-xs" />
          <div class="column">
            <div class="text-weight-bold" style="font-size: 13px; color: #333; line-height: 1.2;">{{ conflict.name }}</div>
            <div class="text-caption text-grey-7" style="font-size: 11px; margin-top: 2px;">{{ conflict.allocated }} allocated • {{ conflict.overCapacity }} over capacity</div>
          </div>
        </div>
        <q-badge color="red-1" text-color="red" label="Overloaded" class="text-weight-bold q-ml-sm q-py-xs rounded-borders" style="font-size: 10px; height: fit-content;" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const conflicts = [
  { name: 'Sarah Johnson', allocated: '124.5h', overCapacity: '96%' },
  { name: 'Michael Chen', allocated: '120.5h', overCapacity: '93%' },
  { name: 'James Wilson', allocated: '135h', overCapacity: '104%' },
  { name: 'Lisa Anderson', allocated: '115h', overCapacity: '88%' }
];
</script>
